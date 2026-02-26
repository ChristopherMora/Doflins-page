export function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || "";

  return new Set(
    raw
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const adminEmails = getAdminEmails();
  if (adminEmails.size === 0) {
    return false;
  }

  return adminEmails.has(email.trim().toLowerCase());
}
