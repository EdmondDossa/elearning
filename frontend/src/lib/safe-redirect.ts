// N'autorise que les chemins internes : "/dashboard" oui, "//evil.com" ou "https://..." non
export function safeRedirect(
  target: string | null,
  fallback = "/dashboard",
): string {
  if (
    !target ||
    !target.startsWith("/") ||
    target.startsWith("//") ||
    target.startsWith("/\\")
  ) {
    return fallback;
  }
  return target;
}
