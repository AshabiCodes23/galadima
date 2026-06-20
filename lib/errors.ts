export function isDuplicateKeyError(err: unknown): err is { code: number } {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === 11000;
}