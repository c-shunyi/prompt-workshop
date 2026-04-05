import bcrypt from 'bcryptjs';
import { execute, queryOne, queryRows } from '../db/client';
import { signAdminToken } from '../utils/jwt';
import { type PaginationParams, type PaginatedResult, normalizePagination } from '../utils/pagination';
import { AdminRole } from '../types';

interface AdminUserRecord {
  id: number;
  username: string;
  passwordHash: string;
  nickname: string | null;
  role: string;
  status: number;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 管理员用户服务层
 * 处理管理员登录、密码校验等业务逻辑
 */

/**
 * 管理员登录
 * @param username 用户名
 * @param password 密码（明文）
 * @returns 登录成功返回 token 和用户信息，失败返回 null
 */
export async function adminLogin(username: string, password: string) {
  // 查找管理员用户
  const admin = await queryOne<AdminUserRecord>(
    `SELECT
      id,
      username,
      password_hash AS passwordHash,
      nickname,
      role,
      status,
      last_login_at AS lastLoginAt,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM admin_users
    WHERE username = ?
    LIMIT 1`,
    [username],
  );

  if (!admin) {
    return null;
  }

  // 校验账号状态
  if (admin.status !== 1) {
    return null;
  }

  // 校验密码
  const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isPasswordValid) {
    return null;
  }

  // 更新最后登录时间
  await execute('UPDATE admin_users SET last_login_at = NOW(), updated_at = NOW() WHERE id = ?', [admin.id]);

  // 签发 JWT Token
  const token = signAdminToken({
    adminId: admin.id,
    username: admin.username,
    role: admin.role as AdminRole,
  });

  return {
    token,
    adminInfo: {
      id: admin.id,
      username: admin.username,
      nickname: admin.nickname,
      role: admin.role,
    },
  };
}

/**
 * 获取管理员列表（仅超级管理员可调用）
 * @returns 管理员列表（不含密码哈希）
 */
export async function getAdminList(
  params: PaginationParams = {},
): Promise<PaginatedResult<Omit<AdminUserRecord, 'passwordHash' | 'updatedAt'>>> {
  const { page, pageSize, offset } = normalizePagination(params);

  const [list, totalRow] = await Promise.all([
    queryRows<Omit<AdminUserRecord, 'passwordHash' | 'updatedAt'>>(
      `SELECT
        id,
        username,
        nickname,
        role,
        status,
        last_login_at AS lastLoginAt,
        created_at AS createdAt
      FROM admin_users
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [pageSize, offset],
    ),
    queryOne<{ total: number }>(
      `SELECT CAST(COUNT(*) AS SIGNED) AS total
      FROM admin_users`,
    ),
  ]);

  return {
    list,
    total: totalRow?.total ?? 0,
    page,
    pageSize,
  };
}

export async function getAdminCount() {
  const result = await queryOne<{ total: number }>(
    `SELECT CAST(COUNT(*) AS SIGNED) AS total
    FROM admin_users`,
  );

  return result?.total ?? 0;
}

/**
 * 创建管理员用户
 * @param data 管理员信息
 * @returns 创建后的管理员（不含密码哈希）
 */
export async function createAdmin(data: {
  username: string;
  password: string;
  nickname?: string;
  role?: string;
}) {
  // 密码加密
  const passwordHash = await bcrypt.hash(data.password, 10);

  const result = await execute(
    `INSERT INTO admin_users
      (username, password_hash, nickname, role, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
    [data.username, passwordHash, data.nickname ?? null, data.role || AdminRole.ADMIN],
  );

  const admin = await queryOne<{
    id: number;
    username: string;
    nickname: string | null;
    role: string;
    status: number;
    createdAt: Date;
  }>(
    `SELECT
      id,
      username,
      nickname,
      role,
      status,
      created_at AS createdAt
    FROM admin_users
    WHERE id = ?
    LIMIT 1`,
    [Number((result as { insertId: number }).insertId)],
  );

  return admin;
}
