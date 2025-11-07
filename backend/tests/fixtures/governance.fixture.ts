/**
 * Test fixtures for governance data
 */

import { testUsers } from './users.fixture';

const now = Math.floor(Date.now() / 1000);

export const testElections = [
  {
    election_id: 1,
    role_name: 'president',
    start_ts: now - 86400 * 10, // Started 10 days ago
    end_ts: now - 86400 * 3, // Ended 3 days ago
    finalized: true,
    winner: testUsers.president.address,
  },
  {
    election_id: 2,
    role_name: 'vice_president',
    start_ts: now - 86400 * 5, // Started 5 days ago
    end_ts: now + 86400 * 2, // Ends in 2 days
    finalized: false,
    winner: undefined,
  },
  {
    election_id: 3,
    role_name: 'advisor',
    start_ts: now + 86400, // Starts in 1 day
    end_ts: now + 86400 * 8, // Ends in 8 days
    finalized: false,
    winner: undefined,
  },
];

export const testElectionCandidates = [
  // Election 1 (president) - finalized
  {
    election_id: 1,
    role_name: 'president',
    candidate: testUsers.president.address,
    timestamp: now - 86400 * 9,
  },
  {
    election_id: 1,
    role_name: 'president',
    candidate: testUsers.eboard_member1.address,
    timestamp: now - 86400 * 9,
  },
  // Election 2 (vice_president) - active
  {
    election_id: 2,
    role_name: 'vice_president',
    candidate: testUsers.vice_president.address,
    timestamp: now - 86400 * 4,
  },
  {
    election_id: 2,
    role_name: 'vice_president',
    candidate: testUsers.eboard_member2.address,
    timestamp: now - 86400 * 4,
  },
  // Election 3 (advisor) - upcoming
  {
    election_id: 3,
    role_name: 'advisor',
    candidate: testUsers.advisor.address,
    timestamp: now,
  },
];

export const testElectionVotes = [
  // Votes for election 1 (finalized president election)
  {
    election_id: 1,
    role_name: 'president',
    voter: testUsers.advisor.address,
    candidate: testUsers.president.address,
    weight: '3', // Advisor weight
    timestamp: now - 86400 * 8,
  },
  {
    election_id: 1,
    role_name: 'president',
    voter: testUsers.eboard_member1.address,
    candidate: testUsers.president.address,
    weight: '2', // E-board weight
    timestamp: now - 86400 * 7,
  },
  {
    election_id: 1,
    role_name: 'president',
    voter: testUsers.eboard_member2.address,
    candidate: testUsers.eboard_member1.address,
    weight: '2', // E-board weight
    timestamp: now - 86400 * 6,
  },
  // Votes for election 2 (active vice_president election)
  {
    election_id: 2,
    role_name: 'vice_president',
    voter: testUsers.president.address,
    candidate: testUsers.vice_president.address,
    weight: '2',
    timestamp: now - 86400 * 3,
  },
];

export const createTestElection = (overrides?: any) => ({
  election_id: Math.floor(Math.random() * 1000),
  role_name: 'president',
  start_ts: now - 86400,
  end_ts: now + 86400 * 7,
  finalized: false,
  winner: undefined,
  ...overrides,
});

export const createTestCandidate = (overrides?: any) => ({
  election_id: 1,
  role_name: 'president',
  candidate: testUsers.eboard_member1.address,
  timestamp: now,
  ...overrides,
});

export const createTestVote = (overrides?: any) => ({
  election_id: 1,
  role_name: 'president',
  voter: testUsers.eboard_member1.address,
  candidate: testUsers.president.address,
  weight: '2',
  timestamp: now,
  ...overrides,
});
