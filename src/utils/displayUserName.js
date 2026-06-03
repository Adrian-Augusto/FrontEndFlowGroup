/** Nome para exibir no header (sem foto de perfil). */
export function getDisplayName(user) {
  const name = user?.name?.trim();
  if (name && name !== "—" && name !== "---" && name.toLowerCase() !== "usuário" && name !== "?") {
    return name;
  }
  const email = user?.email?.trim();
  if (email?.includes("@")) {
    const local = email.split("@")[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return "Usuário";
}
