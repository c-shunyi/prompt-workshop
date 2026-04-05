import 'dotenv/config';
import mariadb from 'mariadb';

const databaseUrl = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/prompt_workshop';
const parsedUrl = new URL(databaseUrl);

export const pool = mariadb.createPool({
  host: parsedUrl.hostname,
  port: parsedUrl.port ? Number(parsedUrl.port) : 3306,
  user: decodeURIComponent(parsedUrl.username),
  password: decodeURIComponent(parsedUrl.password),
  database: parsedUrl.pathname.replace(/^\//, ''),
  connectionLimit: 10,
});

/**
 * 执行查询并返回多行记录
 */
export async function queryRows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const rows = await pool.query(sql, params);
  return Array.isArray(rows) ? (rows as T[]) : [];
}

/**
 * 执行查询并返回单行记录
 */
export async function queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await queryRows<T>(sql, params);
  return rows[0] ?? null;
}

/**
 * 执行写操作
 */
export async function execute(sql: string, params: unknown[] = []) {
  return pool.query(sql, params);
}

export default pool;
