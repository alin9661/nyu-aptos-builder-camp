/**
 * Test fixtures for users
 */

export const testUsers = {
  advisor: {
    address: '0x1111111111111111111111111111111111111111111111111111111111111111',
    role: 'advisor',
    display_name: 'Test Advisor',
    email: 'advisor@test.com',
  },
  president: {
    address: '0x2222222222222222222222222222222222222222222222222222222222222222',
    role: 'president',
    display_name: 'Test President',
    email: 'president@test.com',
  },
  vice_president: {
    address: '0x3333333333333333333333333333333333333333333333333333333333333333',
    role: 'vice_president',
    display_name: 'Test VP',
    email: 'vp@test.com',
  },
  eboard_member1: {
    address: '0x4444444444444444444444444444444444444444444444444444444444444444',
    role: 'eboard_member',
    display_name: 'E-Board Member 1',
    email: 'eboard1@test.com',
  },
  eboard_member2: {
    address: '0x5555555555555555555555555555555555555555555555555555555555555555',
    role: 'eboard_member',
    display_name: 'E-Board Member 2',
    email: 'eboard2@test.com',
  },
  regular_member: {
    address: '0x6666666666666666666666666666666666666666666666666666666666666666',
    role: 'member',
    display_name: 'Regular Member',
    email: 'member@test.com',
  },
};

export const getAllTestUsers = () => Object.values(testUsers);

export const getEboardMembers = () => [
  testUsers.advisor,
  testUsers.president,
  testUsers.vice_president,
  testUsers.eboard_member1,
  testUsers.eboard_member2,
];

export const getVotingMembers = () => [
  testUsers.advisor,
  testUsers.president,
  testUsers.vice_president,
  testUsers.eboard_member1,
  testUsers.eboard_member2,
];
