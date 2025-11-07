/**
 * Test fixtures for proposals data
 */

import { testUsers } from './users.fixture';

const now = Math.floor(Date.now() / 1000);

// Proposal status constants
export const PROPOSAL_STATUS = {
  DRAFT: 0,
  ACTIVE: 1,
  PASSED: 2,
  REJECTED: 3,
  EXECUTED: 4,
};

export const testProposals = [
  {
    proposal_id: 1,
    creator: testUsers.president.address,
    title: 'Increase Treasury Allocation for Events',
    description: 'Proposal to allocate an additional 5 APT for upcoming blockchain events and workshops.',
    status: PROPOSAL_STATUS.EXECUTED,
    start_ts: now - 86400 * 30, // 30 days ago
    end_ts: now - 86400 * 23, // 23 days ago
    yay_votes: '10',
    nay_votes: '2',
  },
  {
    proposal_id: 2,
    creator: testUsers.vice_president.address,
    title: 'Add New Technical Workshop Series',
    description: 'Proposal to organize a 6-week Move programming workshop series for members.',
    status: PROPOSAL_STATUS.PASSED,
    start_ts: now - 86400 * 15, // 15 days ago
    end_ts: now - 86400 * 8, // 8 days ago
    yay_votes: '12',
    nay_votes: '3',
  },
  {
    proposal_id: 3,
    creator: testUsers.eboard_member1.address,
    title: 'Update Club Governance Rules',
    description: 'Proposal to modify voting weights and add new member categories.',
    status: PROPOSAL_STATUS.ACTIVE,
    start_ts: now - 86400 * 3, // 3 days ago
    end_ts: now + 86400 * 4, // 4 days from now
    yay_votes: '8',
    nay_votes: '4',
  },
  {
    proposal_id: 4,
    creator: testUsers.eboard_member2.address,
    title: 'Partnership with DeFi Protocol',
    description: 'Proposal to establish partnership with leading DeFi protocol for educational purposes.',
    status: PROPOSAL_STATUS.ACTIVE,
    start_ts: now - 86400, // 1 day ago
    end_ts: now + 86400 * 6, // 6 days from now
    yay_votes: '5',
    nay_votes: '1',
  },
  {
    proposal_id: 5,
    creator: testUsers.advisor.address,
    title: 'Scholarship Program for Members',
    description: 'Proposal to create a scholarship program funded by treasury for exceptional members.',
    status: PROPOSAL_STATUS.REJECTED,
    start_ts: now - 86400 * 20, // 20 days ago
    end_ts: now - 86400 * 13, // 13 days ago
    yay_votes: '4',
    nay_votes: '9',
  },
];

export const testProposalVotes = [
  // Votes for proposal 1 (executed)
  {
    proposal_id: 1,
    voter: testUsers.advisor.address,
    vote: true,
    weight: '3',
    timestamp: now - 86400 * 29,
  },
  {
    proposal_id: 1,
    voter: testUsers.president.address,
    vote: true,
    weight: '2',
    timestamp: now - 86400 * 28,
  },
  {
    proposal_id: 1,
    voter: testUsers.vice_president.address,
    vote: true,
    weight: '2',
    timestamp: now - 86400 * 27,
  },
  {
    proposal_id: 1,
    voter: testUsers.eboard_member1.address,
    vote: false,
    weight: '2',
    timestamp: now - 86400 * 26,
  },
  // Votes for proposal 2 (passed)
  {
    proposal_id: 2,
    voter: testUsers.advisor.address,
    vote: true,
    weight: '3',
    timestamp: now - 86400 * 14,
  },
  {
    proposal_id: 2,
    voter: testUsers.president.address,
    vote: true,
    weight: '2',
    timestamp: now - 86400 * 13,
  },
  {
    proposal_id: 2,
    voter: testUsers.eboard_member2.address,
    vote: false,
    weight: '2',
    timestamp: now - 86400 * 12,
  },
  // Votes for proposal 3 (active)
  {
    proposal_id: 3,
    voter: testUsers.advisor.address,
    vote: true,
    weight: '3',
    timestamp: now - 86400 * 2,
  },
  {
    proposal_id: 3,
    voter: testUsers.eboard_member2.address,
    vote: false,
    weight: '2',
    timestamp: now - 86400,
  },
  // Votes for proposal 4 (active)
  {
    proposal_id: 4,
    voter: testUsers.president.address,
    vote: true,
    weight: '2',
    timestamp: now - 3600 * 12, // 12 hours ago
  },
  // Votes for proposal 5 (rejected)
  {
    proposal_id: 5,
    voter: testUsers.eboard_member1.address,
    vote: false,
    weight: '2',
    timestamp: now - 86400 * 19,
  },
  {
    proposal_id: 5,
    voter: testUsers.eboard_member2.address,
    vote: false,
    weight: '2',
    timestamp: now - 86400 * 18,
  },
];

export const createTestProposal = (overrides?: any) => ({
  proposal_id: Math.floor(Math.random() * 1000),
  creator: testUsers.president.address,
  title: 'Test Proposal',
  description: 'This is a test proposal for unit testing',
  status: PROPOSAL_STATUS.ACTIVE,
  start_ts: now - 86400,
  end_ts: now + 86400 * 7,
  yay_votes: '0',
  nay_votes: '0',
  ...overrides,
});

export const createTestProposalVote = (overrides?: any) => ({
  proposal_id: 1,
  voter: testUsers.eboard_member1.address,
  vote: true,
  weight: '2',
  timestamp: now,
  ...overrides,
});
