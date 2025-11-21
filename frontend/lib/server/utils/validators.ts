import Joi from 'joi';
import { NextResponse } from 'next/server';

// Aptos address validation (0x followed by 64 hex characters, or shorter with leading zeros omitted)
const aptosAddressSchema = Joi.string()
  .pattern(/^0x[a-fA-F0-9]{1,64}$/)
  .required()
  .messages({
    'string.pattern.base': 'Invalid Aptos address format',
  });

// Reimbursement submission validation
export const reimbursementSubmitSchema = Joi.object({
  payee: aptosAddressSchema,
  amount: Joi.number().integer().positive().required(),
  invoice_uri: Joi.string().uri().required(),
  invoice_hash: Joi.string().required(),
});

// Reimbursement approval validation
export const reimbursementApprovalSchema = Joi.object({
  id: Joi.number().integer().min(0).required(),
  approver: aptosAddressSchema,
});

// Proposal creation validation
export const proposalCreateSchema = Joi.object({
  creator: aptosAddressSchema,
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(5000).required(),
  start_ts: Joi.number().integer().positive().required(),
  end_ts: Joi.number().integer().positive().greater(Joi.ref('start_ts')).required(),
});

// Vote validation
export const voteSchema = Joi.object({
  voter: aptosAddressSchema,
  vote: Joi.boolean().required(),
});

// Election vote validation
export const electionVoteSchema = Joi.object({
  voter: aptosAddressSchema,
  candidate: aptosAddressSchema,
  role_name: Joi.string().required(),
  election_id: Joi.number().integer().min(0).required(),
});

// Pagination validation
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('asc', 'desc').default('desc'),
});

// Helper to validate body in Next.js Route Handler
export const validateBody = async (request: Request, schema: Joi.ObjectSchema) => {
  try {
    const body = await request.json();
    const { error, value } = schema.validate(body);
    if (error) {
      return { error: error.details.map((d) => d.message).join(', '), value: null };
    }
    return { error: null, value };
  } catch (e) {
    return { error: 'Invalid JSON body', value: null };
  }
};

// Helper to validate query params
export const validateQuery = (searchParams: URLSearchParams, schema: Joi.ObjectSchema) => {
  const query: any = {};
  for (const [key, value] of searchParams.entries()) {
    query[key] = value;
  }
  const { error, value } = schema.validate(query);
  if (error) {
    return { error: error.details.map((d) => d.message).join(', '), value: null };
  }
  return { error: null, value };
};

// Address validation helper
export const isValidAptosAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{1,64}$/.test(address);
};