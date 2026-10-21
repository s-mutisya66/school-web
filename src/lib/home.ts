/** Where each kind of user lands after signing in. */
export function homePathFor(user: { role: "ADMIN" | "TEACHER" | "PARENT"; children?: { id: number }[] }): string {
  if (user.role === "ADMIN") return "/admin";
  if (user.role === "TEACHER") return "/admin";
  if (user.role === "PARENT") return user.children?.length === 1 ? `/students/${user.children[0].id}/fees` : "/parent";
  return "/login";
}
