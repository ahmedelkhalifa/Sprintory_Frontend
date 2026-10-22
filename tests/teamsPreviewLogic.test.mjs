import test from 'node:test';
import assert from 'node:assert/strict';
import { demoTeams } from '../src/pages/teams/teamsDemoData.js';
import {
  getVisibleTeams, isDuplicateTeamName, isDuplicateInvitation, removeTeamDraftInvitations,
} from '../src/pages/teams/teamsPreviewLogic.js';

test('search matches team descriptions case-insensitively', () => {
  const teams = getVisibleTeams(demoTeams, { search: 'REGRESSION' });
  assert.deepEqual(teams.map((t) => t.name), ['Quality Assurance']);
});

test('my teams uses the chosen demo member and does not mutate source', () => {
  const original = demoTeams.map((team) => team.name);
  const teams = getVisibleTeams(demoTeams, { tab: 1, currentMemberId: 'member-1' });
  assert.deepEqual(teams.map((team) => team.name), ['Backend', 'Frontend', 'Product Development']);
  assert.deepEqual(demoTeams.map((team) => team.name), original);
});

test('sorting by member count and name is deterministic', () => {
  const teams = getVisibleTeams(demoTeams, { sort: 'members' });
  assert.equal(teams[0].members.length, 5);
  assert.equal(teams[0].name, 'Backend');
});

test('duplicate names reject case/whitespace variants but allow editing self', () => {
  assert.equal(isDuplicateTeamName(demoTeams, '  BACKEND  '), true);
  assert.equal(isDuplicateTeamName(demoTeams, 'Backend', 'team-3'), false);
  assert.equal(isDuplicateTeamName(demoTeams, 'Data Platform'), false);
  assert.equal(isDuplicateTeamName(demoTeams, '   '), false);
});

test('draft invite duplicates are scoped by both email and destination', () => {
  const invites = [{ email: 'member@example.com', teamId: 'team-1' }];
  assert.equal(isDuplicateInvitation(invites, ' MEMBER@EXAMPLE.COM ', 'team-1'), true);
  assert.equal(isDuplicateInvitation(invites, 'member@example.com', 'team-2'), false);
});

test('removing a team also removes only its unsent draft invitations', () => {
  const invites = [
    { email: 'a@example.com', teamId: 'team-1' },
    { email: 'b@example.com', teamId: 'team-2' },
    { email: 'c@example.com', teamId: '' },
  ];
  assert.deepEqual(removeTeamDraftInvitations(invites, 'team-1'), invites.slice(1));
  assert.equal(invites.length, 3);
});
