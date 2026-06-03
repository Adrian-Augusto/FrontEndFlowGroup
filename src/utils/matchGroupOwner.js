/** Filtra grupos criados pelo usuário logado. */
export function filterMyGroups(groups, user) {
  if (!user || !Array.isArray(groups)) return [];

  const userId = user.id ?? user.googleId ?? null;
  const email = user.email?.trim().toLowerCase() ?? null;

  return groups.filter((g) => {
    const by = g.createdBy;
    if (!by) return false;
    if (userId && (by.id === userId || by.googleId === userId)) return true;
    if (email && by.email?.trim().toLowerCase() === email) return true;
    return false;
  });
}
