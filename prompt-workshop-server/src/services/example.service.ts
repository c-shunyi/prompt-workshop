import { execute, queryOne, queryRows } from '../db/client';

export interface Example {
  id: number;
  title: string;
  description: string | null;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 示例业务服务层
 * 客户端 API 和管理台 API 共享此服务，避免重复实现业务逻辑
 */

/**
 * 获取示例列表
 * @param page 页码（从 1 开始）
 * @param pageSize 每页数量
 * @returns 分页数据和总数
 */
export async function getExampleList(page = 1, pageSize = 10) {
  const skip = (page - 1) * pageSize;

  const [list, totalRow] = await Promise.all([
    queryRows<Example>(
      `SELECT
        id,
        title,
        description,
        status,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM examples
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [pageSize, skip],
    ),
    queryOne<{ total: number }>('SELECT COUNT(*) AS total FROM examples'),
  ]);

  return { list, total: totalRow?.total ?? 0, page, pageSize };
}

/**
 * 根据 ID 获取单个示例
 * @param id 示例 ID
 * @returns 示例记录或 null
 */
export async function getExampleById(id: number): Promise<Example | null> {
  return queryOne<Example>(
    `SELECT
      id,
      title,
      description,
      status,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM examples
    WHERE id = ?
    LIMIT 1`,
    [id],
  );
}

/**
 * 创建示例记录
 * @param data 创建数据
 * @returns 创建后的记录
 */
export async function createExample(data: { title: string; description?: string }): Promise<Example> {
  const result = await execute(
    `INSERT INTO examples (title, description, status, created_at, updated_at)
     VALUES (?, ?, 1, NOW(), NOW())`,
    [data.title, data.description ?? null],
  );

  return getExampleById(Number((result as { insertId: number }).insertId)) as Promise<Example>;
}

/**
 * 更新示例记录
 * @param id 示例 ID
 * @param data 更新数据
 * @returns 更新后的记录
 */
export async function updateExample(
  id: number,
  data: { title?: string; description?: string; status?: number }
): Promise<Example> {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.title !== undefined) {
    fields.push('title = ?');
    params.push(data.title);
  }

  if (data.description !== undefined) {
    fields.push('description = ?');
    params.push(data.description);
  }

  if (data.status !== undefined) {
    fields.push('status = ?');
    params.push(data.status);
  }

  fields.push('updated_at = NOW()');
  params.push(id);

  await execute(`UPDATE examples SET ${fields.join(', ')} WHERE id = ?`, params);

  return getExampleById(id) as Promise<Example>;
}

/**
 * 删除示例记录
 * @param id 示例 ID
 * @returns 被删除的记录
 */
export async function deleteExample(id: number): Promise<Example> {
  const example = await getExampleById(id);

  if (!example) {
    throw new Error('记录不存在');
  }

  await execute('DELETE FROM examples WHERE id = ?', [id]);

  return example;
}
