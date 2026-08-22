export function parseCorsOrigins(
  value: string | undefined,
): string[] | undefined {
  if (!value) {
    return undefined;
  }

  const origins = [
    ...new Set(value.split(',').map((origin) => origin.trim())),
  ].filter(Boolean);

  return origins.length > 0 ? origins : undefined;
}
