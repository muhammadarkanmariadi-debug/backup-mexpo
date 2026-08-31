/**
 * Hybrid database support (Option A): decide which driver adapter to use and
 * build the connection string.
 *
 * Two ways to configure (DATABASE_URL wins if both are present):
 *  1. DATABASE_URL — full connection string (kept for backward compat).
 *  2. Connection parameters — DB_PROVIDER + DB_HOST / DB_PORT / DB_USER /
 *     DB_PASSWORD / DB_NAME (+ DB_SSLMODE for PostgreSQL). The URL is
 *     composed here so no single-string secret needs to be copied around.
 *
 * Provider is chosen from DB_PROVIDER if set, otherwise inferred from the
 * DATABASE_URL scheme (`mysql://` -> mariadb adapter, otherwise postgres).
 * When only individual params are set, DB_PROVIDER=mysql must be set for a
 * MySQL target (the default when unset is postgresql).
 */

export type DbProvider = 'mysql' | 'postgresql';

export function resolveDbProvider(
  databaseUrl?: string,
  providerOverride?: string,
): DbProvider {
  const override = (providerOverride || '').toLowerCase();
  if (override === 'mysql' || override === 'postgresql') return override;
  return (databaseUrl || '').startsWith('mysql://') ? 'mysql' : 'postgresql';
}

export function isMysqlDatabase(
  databaseUrl?: string,
  providerOverride?: string,
): boolean {
  return resolveDbProvider(databaseUrl, providerOverride) === 'mysql';
}

/**
 * Build a connection URL from individual parameters:
 *   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSLMODE.
 * DB_SSLMODE only applies to PostgreSQL (default `no-verify`, matching the
 * Supabase pooler); set it empty to disable SSL.
 */
export function buildDatabaseUrl(
  provider: DbProvider,
  env: Record<string, string | undefined> = process.env,
): string {
  const host = env.DB_HOST;
  const user = env.DB_USER;
  const password = env.DB_PASSWORD ?? '';
  const name = env.DB_NAME;
  if (!host || !user || !name) {
    throw new Error(
      `Database connection parameters are incomplete. Set DB_HOST, DB_USER ` +
        `and DB_NAME (plus DB_PASSWORD) in .env. Provider resolved to ` +
        `"${provider}".`,
    );
  }
  const port = env.DB_PORT || (provider === 'mysql' ? '3306' : '5432');
  // encodeURIComponent handles special chars (@ : / # etc.) in user/password.
  const creds = `${encodeURIComponent(user)}:${encodeURIComponent(password)}`;
  if (provider === 'mysql') {
    return `mysql://${creds}@${host}:${port}/${name}`;
  }
  // DB_SSLMODE is used for PostgreSQL. If set to empty or 'disable', no sslmode query param is appended.
  let sslMode = env.DB_SSLMODE !== undefined ? env.DB_SSLMODE.trim() : '';
  if (sslMode === 'disable' || sslMode === 'false' || sslMode === 'off') {
    sslMode = '';
  }
  const query = sslMode ? `?sslmode=${encodeURIComponent(sslMode)}` : '';
  return `postgresql://${creds}@${host}:${port}/${name}${query}`;
}

/**
 * The effective connection URL: DATABASE_URL if provided, otherwise composed
 * from the individual DB_* connection parameters.
 */
export function getDatabaseUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  if (env.DATABASE_URL) return env.DATABASE_URL;
  const provider = resolveDbProvider(env.DATABASE_URL, env.DB_PROVIDER);
  return buildDatabaseUrl(provider, env);
}

/** True when either DATABASE_URL or the individual DB_* params are present. */
export function hasDbConfig(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (env.DATABASE_URL) return true;
  return Boolean(env.DB_HOST && env.DB_USER && env.DB_NAME);
}
