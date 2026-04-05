import 'dotenv/config';
import mariadb, { type PoolConnection, type Pool as MariaPool } from 'mariadb';

const databaseUrl = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/prompt_workshop';
const parsedUrl = new URL(databaseUrl);

export const pool = mariadb.createPool({
  host: parsedUrl.hostname,
  port: parsedUrl.port ? Number(parsedUrl.port) : 3306,
  user: decodeURIComponent(parsedUrl.username),
  password: decodeURIComponent(parsedUrl.password),
  database: parsedUrl.pathname.replace(/^\//, ''),
  connectionLimit: 10,
  bigIntAsNumber: true,
});

type QueryExecutor = MariaPool | PoolConnection;

/**
 * 执行查询并返回多行记录
 */
export async function queryRows<T>(
  sql: string,
  params: unknown[] = [],
  executor: QueryExecutor = pool,
): Promise<T[]> {
  const rows = await executor.query(sql, params);
  return Array.isArray(rows) ? (rows as T[]) : [];
}

/**
 * 执行查询并返回单行记录
 */
export async function queryOne<T>(
  sql: string,
  params: unknown[] = [],
  executor: QueryExecutor = pool,
): Promise<T | null> {
  const rows = await queryRows<T>(sql, params, executor);
  return rows[0] ?? null;
}

/**
 * 执行写操作
 */
export async function execute(sql: string, params: unknown[] = [], executor: QueryExecutor = pool) {
  return executor.query(sql, params);
}

/**
 * 使用连接执行操作
 */
export async function withConnection<T>(handler: (connection: PoolConnection) => Promise<T>) {
  const connection = await pool.getConnection();

  try {
    return await handler(connection);
  } finally {
    connection.release();
  }
}

/**
 * 事务执行器
 */
export async function withTransaction<T>(handler: (connection: PoolConnection) => Promise<T>) {
  return withConnection(async (connection) => {
    await connection.beginTransaction();

    try {
      const result = await handler(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  });
}

export default pool;
