import prisma from '../prisma/client';
import { Example } from '../generated/prisma';

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

  const [list, total] = await Promise.all([
    prisma.example.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.example.count(),
  ]);

  return { list, total, page, pageSize };
}

/**
 * 根据 ID 获取单个示例
 * @param id 示例 ID
 * @returns 示例记录或 null
 */
export async function getExampleById(id: number): Promise<Example | null> {
  return prisma.example.findUnique({ where: { id } });
}

/**
 * 创建示例记录
 * @param data 创建数据
 * @returns 创建后的记录
 */
export async function createExample(data: { title: string; description?: string }): Promise<Example> {
  return prisma.example.create({ data });
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
  return prisma.example.update({ where: { id }, data });
}

/**
 * 删除示例记录
 * @param id 示例 ID
 * @returns 被删除的记录
 */
export async function deleteExample(id: number): Promise<Example> {
  return prisma.example.delete({ where: { id } });
}
