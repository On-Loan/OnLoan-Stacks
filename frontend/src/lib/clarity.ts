/**
 * Extract a scalar value from a cvToValue tuple field.
 *
 * cvToValue returns tuple fields as { type, value } objects.
 * This helper safely unwraps the inner `.value`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cvField(field: any): string {
  if (field && typeof field === "object" && "value" in field) {
    return String(field.value);
  }
  return String(field ?? "0");
}
