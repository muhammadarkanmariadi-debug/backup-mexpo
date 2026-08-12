/**
 * Hybrid database support (Option A): decide which driver adapter to use.
 *
 * Provider is chosen from `DB_PROVIDER` if set, otherwise inferred from the
 * DATABASE_URL scheme (`mysql://` -> mariadb adapter, otherwise postgres).
 */
export function isMysqlDatabase(
  databaseUrl?: string,
  providerOverride?: string,
): boolean {
  const override = (providerOverride || '').toLowerCase();
  if (override === 'mysql' || override === 'postgresql') {
    return override === 'mysql';
  }
  return (databaseUrl || '').startsWith('mysql://');
}
