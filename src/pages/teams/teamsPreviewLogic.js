// Pure, local-only Teams preview helpers. Replace this state management with the
// workspace API once the backend contract is available.
export function getVisibleTeams(teams, { tab = 0, search = "", sort = "name", currentMemberId }) {
  const query = search.trim().toLocaleLowerCase();
  return teams
    .filter((team) => tab !== 1 || team.members.includes(currentMemberId))
    .filter((team) => `${team.name} ${team.description}`.toLocaleLowerCase().includes(query))
    .sort((a, b) => {
      if (sort === "members") return b.members.length - a.members.length || a.name.localeCompare(b.name);
      if (sort === "projects") return b.projects.length - a.projects.length || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
}

export function isDuplicateTeamName(teams, name, editingId = null) {
  const normalized = name.trim().toLocaleLowerCase();
  return Boolean(normalized) && teams.some(
    (team) => team.id !== editingId && team.name.trim().toLocaleLowerCase() === normalized,
  );
}

export function isDuplicateInvitation(invites, email, teamId) {
  const normalized = email.trim().toLocaleLowerCase();
  return invites.some((invite) => invite.email === normalized && invite.teamId === teamId);
}

export function removeTeamDraftInvitations(invites, teamId) {
  return invites.filter((invite) => invite.teamId !== teamId);
}
