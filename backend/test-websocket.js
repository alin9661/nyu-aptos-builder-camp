#!/usr/bin/env node

/**
 * WebSocket Test Client
 *
 * Simple test client to verify WebSocket functionality
 *
 * Usage:
 *   node test-websocket.js [url]
 *
 * Example:
 *   node test-websocket.js http://localhost:3001
 */

const { io } = require('socket.io-client');

const SERVER_URL = process.argv[2] || 'http://localhost:3001';
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

let eventCount = 0;
let connectionTime = null;

console.log(`${COLORS.cyan}╔════════════════════════════════════════════════════════════╗`);
console.log(`║          WebSocket Test Client for NYU Aptos Backend      ║`);
console.log(`╚════════════════════════════════════════════════════════════╝${COLORS.reset}\n`);

console.log(`${COLORS.blue}Connecting to: ${SERVER_URL}${COLORS.reset}\n`);

// Create Socket.IO client
const socket = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// Connection events
socket.on('connect', () => {
  connectionTime = Date.now();
  console.log(`${COLORS.green}✓ Connected to WebSocket server${COLORS.reset}`);
  console.log(`  Socket ID: ${socket.id}`);
  console.log(`  Transport: ${socket.io.engine.transport.name}\n`);

  // Subscribe to all available channels
  const channels = [
    'treasury:deposit',
    'treasury:balance',
    'reimbursements:new',
    'reimbursements:approved',
    'reimbursements:paid',
    'elections:vote',
    'elections:finalized',
    'proposals:new',
    'proposals:vote',
    'proposals:finalized',
  ];

  console.log(`${COLORS.blue}Subscribing to channels...${COLORS.reset}`);
  socket.emit('subscribe', channels);
});

socket.on('disconnect', (reason) => {
  console.log(`\n${COLORS.red}✗ Disconnected: ${reason}${COLORS.reset}`);
});

socket.on('connect_error', (error) => {
  console.error(`${COLORS.red}✗ Connection error: ${error.message}${COLORS.reset}`);
  console.error(`  Make sure the server is running at ${SERVER_URL}`);
  process.exit(1);
});

// Subscription confirmation
socket.on('subscribed', (data) => {
  console.log(`${COLORS.green}✓ Subscribed to ${data.channels.length} channels${COLORS.reset}`);
  data.channels.forEach((channel) => {
    console.log(`  - ${channel}`);
  });
  console.log(`\n${COLORS.yellow}Listening for events... (Press Ctrl+C to exit)${COLORS.reset}\n`);
});

// Treasury events
socket.on('treasury:deposit', (data) => {
  eventCount++;
  console.log(`${COLORS.cyan}[${eventCount}] 💰 Treasury Deposit${COLORS.reset}`);
  console.log(`  Source: ${data.source}`);
  console.log(`  Amount: ${data.amount}`);
  console.log(`  Total Balance: ${data.totalBalance}`);
  console.log(`  TX: ${data.transactionHash}`);
  console.log(`  Time: ${data.timestamp}\n`);
});

socket.on('treasury:balance', (data) => {
  eventCount++;
  console.log(`${COLORS.cyan}[${eventCount}] 💵 Treasury Balance Change${COLORS.reset}`);
  console.log(`  Balance: ${data.balance}`);
  console.log(`  Change: ${data.changeAmount} (${data.changeType})`);
  console.log(`  Time: ${data.timestamp}\n`);
});

// Reimbursement events
socket.on('reimbursements:new', (data) => {
  eventCount++;
  console.log(`${COLORS.green}[${eventCount}] 📝 New Reimbursement Request${COLORS.reset}`);
  console.log(`  ID: ${data.id}`);
  console.log(`  Payer: ${data.payer}`);
  console.log(`  Payee: ${data.payee}`);
  console.log(`  Amount: ${data.amount}`);
  console.log(`  Invoice: ${data.invoiceUri}`);
  console.log(`  TX: ${data.transactionHash}\n`);
});

socket.on('reimbursements:approved', (data) => {
  eventCount++;
  console.log(`${COLORS.green}[${eventCount}] ✅ Reimbursement Approved${COLORS.reset}`);
  console.log(`  ID: ${data.id}`);
  console.log(`  Approver: ${data.approver}`);
  console.log(`  Role: ${data.role}`);
  console.log(`  Advisor: ${data.approved.advisor ? '✓' : '✗'}`);
  console.log(`  President: ${data.approved.president ? '✓' : '✗'}`);
  console.log(`  Vice: ${data.approved.vice ? '✓' : '✗'}`);
  console.log(`  Fully Approved: ${data.fullyApproved ? 'YES' : 'NO'}\n`);
});

socket.on('reimbursements:paid', (data) => {
  eventCount++;
  console.log(`${COLORS.green}[${eventCount}] 💸 Reimbursement Paid${COLORS.reset}`);
  console.log(`  ID: ${data.id}`);
  console.log(`  Payee: ${data.payee}`);
  console.log(`  Amount: ${data.amount}`);
  console.log(`  TX: ${data.transactionHash}\n`);
});

// Election events
socket.on('elections:vote', (data) => {
  eventCount++;
  console.log(`${COLORS.blue}[${eventCount}] 🗳️  Election Vote${COLORS.reset}`);
  console.log(`  Election: ${data.electionId}`);
  console.log(`  Role: ${data.roleName}`);
  console.log(`  Voter: ${data.voter}`);
  console.log(`  Candidate: ${data.candidate}`);
  console.log(`  Weight: ${data.weight}\n`);
});

socket.on('elections:finalized', (data) => {
  eventCount++;
  console.log(`${COLORS.blue}[${eventCount}] 🏆 Election Finalized${COLORS.reset}`);
  console.log(`  Election: ${data.electionId}`);
  console.log(`  Role: ${data.roleName}`);
  console.log(`  Winner: ${data.winner || 'TIE'}`);
  console.log(`  Is Tie: ${data.isTie}`);
  console.log(`  Total Votes: ${data.totalVotes}\n`);
});

// Proposal events
socket.on('proposals:new', (data) => {
  eventCount++;
  console.log(`${COLORS.yellow}[${eventCount}] 📋 New Proposal${COLORS.reset}`);
  console.log(`  ID: ${data.proposalId}`);
  console.log(`  Creator: ${data.creator}`);
  console.log(`  Title: ${data.title}`);
  console.log(`  Start: ${data.startTs}`);
  console.log(`  End: ${data.endTs}`);
  console.log(`  TX: ${data.transactionHash}\n`);
});

socket.on('proposals:vote', (data) => {
  eventCount++;
  console.log(`${COLORS.yellow}[${eventCount}] 🗳️  Proposal Vote${COLORS.reset}`);
  console.log(`  Proposal: ${data.proposalId}`);
  console.log(`  Voter: ${data.voter}`);
  console.log(`  Vote: ${data.vote ? 'YAY' : 'NAY'}`);
  console.log(`  Weight: ${data.weight}`);
  console.log(`  Current Yay: ${data.yayVotes}`);
  console.log(`  Current Nay: ${data.nayVotes}\n`);
});

socket.on('proposals:finalized', (data) => {
  eventCount++;
  console.log(`${COLORS.yellow}[${eventCount}] 🏁 Proposal Finalized${COLORS.reset}`);
  console.log(`  Proposal: ${data.proposalId}`);
  console.log(`  Status: ${data.status}`);
  console.log(`  Passed: ${data.passed ? 'YES' : 'NO'}`);
  console.log(`  Yay Votes: ${data.yayVotes}`);
  console.log(`  Nay Votes: ${data.nayVotes}\n`);
});

// System events
socket.on('system:message', (data) => {
  console.log(`${COLORS.red}[SYSTEM] ${data.message}${COLORS.reset}\n`);
});

// Ping/pong health check
let pingInterval = setInterval(() => {
  if (socket.connected) {
    const pingTime = Date.now();
    socket.emit('ping');

    socket.once('pong', (data) => {
      const latency = Date.now() - pingTime;
      console.log(`${COLORS.cyan}🏓 Ping: ${latency}ms${COLORS.reset}`);
    });
  }
}, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n${COLORS.yellow}Shutting down...${COLORS.reset}`);

  clearInterval(pingInterval);

  const duration = connectionTime ? Math.round((Date.now() - connectionTime) / 1000) : 0;

  console.log(`\n${COLORS.cyan}╔════════════════════════════════════════════════════════════╗`);
  console.log(`║                     Session Summary                        ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝${COLORS.reset}`);
  console.log(`  Duration: ${duration}s`);
  console.log(`  Events received: ${eventCount}`);
  console.log(`  Average rate: ${duration > 0 ? (eventCount / duration).toFixed(2) : 0} events/sec\n`);

  socket.close();
  process.exit(0);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error(`${COLORS.red}Uncaught exception: ${error.message}${COLORS.reset}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(`${COLORS.red}Unhandled rejection: ${reason}${COLORS.reset}`);
  process.exit(1);
});
