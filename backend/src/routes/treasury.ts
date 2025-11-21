import { Router, Request, Response } from 'express';
import multer from 'multer';
import { aptos, MODULES, COIN_TYPE, formatCoinAmount } from '../config/aptos';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import { validateQuery, paginationSchema } from '../utils/validators';
import { verifyAuth, requireLeadership, AuthenticatedRequest } from '../middleware/auth';
import { uploadService } from '../services/uploadService';

const router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Validate file type
    const allowedMimes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, PNG, JPG, DOC, DOCX'));
    }
  },
});

/**
 * GET /api/treasury/balance
 * Get current vault balance from blockchain
 */
router.get('/balance', async (_req: Request, res: Response) => {
  try {
    // Call view function to get balance
    const balance = await aptos.view({
      payload: {
        function: `${MODULES.TREASURY}::get_balance`,
        typeArguments: [COIN_TYPE],
        functionArguments: [],
      },
    });

    const balanceAmount = BigInt(balance[0] as number);

    return res.json({
      success: true,
      data: {
        balance: balanceAmount.toString(),
        balanceFormatted: formatCoinAmount(balanceAmount),
        coinType: COIN_TYPE,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch treasury balance', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch treasury balance',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/treasury/transactions
 * Get transaction history from database (deposits)
 */
router.get('/transactions', validateQuery(paginationSchema), async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, sort = 'desc' } = req.query as any;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM treasury_deposits'
    );
    const total = parseInt(countResult[0].count);

    // Get paginated transactions
    const transactions = await query(
      `SELECT
        id, source, amount, total_balance,
        transaction_hash, version, block_height, timestamp
      FROM treasury_deposits
      ORDER BY timestamp ${sort === 'asc' ? 'ASC' : 'DESC'}
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return res.json({
      success: true,
      data: {
        transactions: transactions.map(tx => ({
          ...tx,
          amount: tx.amount.toString(),
          totalBalance: tx.total_balance.toString(),
          amountFormatted: formatCoinAmount(tx.amount),
          totalBalanceFormatted: formatCoinAmount(tx.total_balance),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Failed to fetch treasury transactions', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch treasury transactions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/treasury/stats
 * Get treasury statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    // Get aggregate stats
    const stats = await query(`
      SELECT
        COALESCE(SUM(CASE WHEN source = 'SPONSOR' THEN amount ELSE 0 END), 0) as sponsor_total,
        COALESCE(SUM(CASE WHEN source = 'MERCH' THEN amount ELSE 0 END), 0) as merch_total,
        COALESCE(SUM(amount), 0) as total_deposits,
        COUNT(*) as deposit_count
      FROM treasury_deposits
    `);

    const reimbursementStats = await query(`
      SELECT
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE paid_out = true) as paid_requests,
        COUNT(*) FILTER (WHERE paid_out = false) as pending_requests,
        COALESCE(SUM(amount) FILTER (WHERE paid_out = true), 0) as total_paid,
        COALESCE(SUM(amount) FILTER (WHERE paid_out = false), 0) as total_pending
      FROM reimbursement_requests
    `);

    return res.json({
      success: true,
      data: {
        deposits: {
          sponsorTotal: stats[0].sponsor_total.toString(),
          merchTotal: stats[0].merch_total.toString(),
          totalDeposits: stats[0].total_deposits.toString(),
          depositCount: parseInt(stats[0].deposit_count),
          sponsorTotalFormatted: formatCoinAmount(stats[0].sponsor_total),
          merchTotalFormatted: formatCoinAmount(stats[0].merch_total),
          totalDepositsFormatted: formatCoinAmount(stats[0].total_deposits),
        },
        reimbursements: {
          totalRequests: parseInt(reimbursementStats[0].total_requests),
          paidRequests: parseInt(reimbursementStats[0].paid_requests),
          pendingRequests: parseInt(reimbursementStats[0].pending_requests),
          totalPaid: reimbursementStats[0].total_paid.toString(),
          totalPending: reimbursementStats[0].total_pending.toString(),
          totalPaidFormatted: formatCoinAmount(reimbursementStats[0].total_paid),
          totalPendingFormatted: formatCoinAmount(reimbursementStats[0].total_pending),
        },
      },
    });
  } catch (error) {
    logger.error('Failed to fetch treasury stats', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch treasury stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/reimbursements/submit
 * Submit new reimbursement request (blockchain transaction)
 * Note: This endpoint receives transaction hash after frontend submits to blockchain
 * Requires authentication
 */
router.post('/reimbursements/submit', verifyAuth as any, async (req: any, res: Response) => {
  try {
    const { transactionHash } = req.body;

    if (!transactionHash) {
      return res.status(400).json({
        success: false,
        error: 'Transaction hash is required',
      });
    }

    // Wait for transaction to be indexed
    const txn = await aptos.waitForTransaction({
      transactionHash,
    });

    logger.info('Reimbursement submitted', { transactionHash, version: txn.version });

    return res.json({
      success: true,
      data: {
        transactionHash,
        version: txn.version,
        success: txn.success,
      },
    });
  } catch (error) {
    logger.error('Failed to process reimbursement submission', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to process reimbursement submission',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/reimbursements
 * Get all reimbursement requests
 */
router.get('/reimbursements', validateQuery(paginationSchema), async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, sort = 'desc' } = req.query as any;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM reimbursement_requests'
    );
    const total = parseInt(countResult[0].count);

    // Get paginated requests
    const requests = await query(
      `SELECT
        r.*,
        u1.display_name as payer_name,
        u2.display_name as payee_name
      FROM reimbursement_requests r
      LEFT JOIN users u1 ON r.payer = u1.address
      LEFT JOIN users u2 ON r.payee = u2.address
      ORDER BY r.created_ts ${sort === 'asc' ? 'ASC' : 'DESC'}
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return res.json({
      success: true,
      data: {
        requests: requests.map(req => ({
          ...req,
          amount: req.amount.toString(),
          amountFormatted: formatCoinAmount(req.amount),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Failed to fetch reimbursements', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch reimbursements',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/reimbursements/:id
 * Get specific reimbursement request details
 */
router.get('/reimbursements/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const requests = await query(
      `SELECT
        r.*,
        u1.display_name as payer_name,
        u2.display_name as payee_name,
        i.ipfs_hash, i.file_name, i.file_size, i.mime_type
      FROM reimbursement_requests r
      LEFT JOIN users u1 ON r.payer = u1.address
      LEFT JOIN users u2 ON r.payee = u2.address
      LEFT JOIN invoice_metadata i ON r.id = i.request_id
      WHERE r.id = $1`,
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reimbursement request not found',
      });
    }

    // Get approvals
    const approvals = await query(
      `SELECT
        a.*,
        u.display_name as approver_name
      FROM reimbursement_approvals a
      LEFT JOIN users u ON a.approver = u.address
      WHERE a.request_id = $1
      ORDER BY a.timestamp ASC`,
      [id]
    );

    const request = requests[0];
    return res.json({
      success: true,
      data: {
        ...request,
        amount: request.amount.toString(),
        amountFormatted: formatCoinAmount(request.amount),
        approvals,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch reimbursement details', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch reimbursement details',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/reimbursements/:id/approve
 * Record approval transaction
 * Requires authentication - Leadership role (advisor, president, VP)
 */
router.post('/reimbursements/:id/approve', verifyAuth as any, requireLeadership as any, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { transactionHash } = req.body;

    if (!transactionHash) {
      return res.status(400).json({
        success: false,
        error: 'Transaction hash is required',
      });
    }

    // Wait for transaction to be indexed
    const txn = await aptos.waitForTransaction({
      transactionHash,
    });

    logger.info('Reimbursement approved', { requestId: id, transactionHash, version: txn.version });

    return res.json({
      success: true,
      data: {
        transactionHash,
        version: txn.version,
        success: txn.success,
      },
    });
  } catch (error) {
    logger.error('Failed to process reimbursement approval', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to process reimbursement approval',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Temporarily disabled due to IPFS issues
// /**
//  * POST /api/treasury/invoices/upload
//  * Upload invoice to IPFS
//  * Requires authentication
//  */
// router.post('/invoices/upload', verifyAuth as any, upload.single('invoice'), async (req: any, res: Response) => {
//   try {
//     const { requestId } = req.body;

//     if (!requestId) {
//       return res.status(400).json({
//         success: false,
//         error: 'Request ID is required',
//       });
//     }

//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invoice file is required',
//       });
//     }

//     // Validate file
//     const validation = validateInvoiceFile(
//       req.file.buffer,
//       req.file.originalname,
//       req.file.mimetype
//     );

//     if (!validation.valid) {
//       return res.status(400).json({
//         success: false,
//         error: validation.error || 'Invalid file',
//       });
//     }

//     // Upload to IPFS
//     const result = await uploadInvoice(
//       parseInt(requestId),
//       req.file.buffer,
//       req.file.originalname,
//       req.file.mimetype
//     );

//     logger.info('Invoice uploaded successfully', { requestId, ipfsHash: result.ipfsHash });

//     return res.json({
//       success: true,
//       data: {
//         ipfsHash: result.ipfsHash,
//         fileSize: result.fileSize,
//         fileName: req.file.originalname,
//         downloadUrl: getInvoiceDownloadURL(result.ipfsHash),
//       },
//     });
//   } catch (error) {
//     logger.error('Failed to upload invoice', { error });
//     return res.status(500).json({
//       success: false,
//       error: 'Failed to upload invoice',
//       message: error instanceof Error ? error.message : 'Unknown error',
//     });
//   }
// });

// Temporarily disabled due to IPFS issues
// /**
//  * GET /api/treasury/invoices/:requestId
//  * Get invoice metadata
//  */
// router.get('/invoices/:requestId', async (req: Request, res: Response) => {
//   try {
//     const { requestId } = req.params;

//     const metadata = await getInvoiceMetadata(parseInt(requestId));

//     if (!metadata) {
//       return res.status(404).json({
//         success: false,
//         error: 'Invoice not found',
//       });
//     }

//     return res.json({
//       success: true,
//       data: metadata,
//     });
//   } catch (error) {
//     logger.error('Failed to fetch invoice metadata', { error });
//     return res.status(500).json({
//       success: false,
//       error: 'Failed to fetch invoice metadata',
//       message: error instanceof Error ? error.message : 'Unknown error',
//     });
//   }
// });

// Temporarily disabled due to IPFS issues
// /**
//  * GET /api/treasury/invoices/:requestId/download
//  * Download invoice from IPFS
//  */
// router.get('/invoices/:requestId/download', async (req: Request, res: Response) => {
//   try {
//     const { requestId } = req.params;

//     const metadata = await getInvoiceMetadata(parseInt(requestId));

//     if (!metadata) {
//       return res.status(404).json({
//         success: false,
//         error: 'Invoice not found',
//       });
//     }

//     // Fetch file from IPFS
//     const fileBuffer = await getFromIPFS(metadata.ipfs_hash);

//     // Set proper headers
//     res.setHeader('Content-Type', metadata.mime_type);
//     res.setHeader('Content-Disposition', `attachment; filename="${metadata.file_name}"`);

//     // Stream the file buffer
//     return res.send(fileBuffer);
//   } catch (error) {
//     logger.error('Failed to download invoice', { error });
//     return res.status(500).json({
//       success: false,
//       error: 'Failed to download invoice',
//       message: error instanceof Error ? error.message : 'Unknown error',
//     });
//   }
// });

export default router;
