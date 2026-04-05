import bcrypt from 'bcryptjs';
import { execute, queryOne, queryRows } from '../db/client';
import { signToken } from '../utils/jwt';

interface UserRecord {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  nickname: string | null;
  avatar: string | null;
  bio: string | null;
  status: number;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 前台用户服务层
 * 处理注册、登录、个人信息与管理台用户列表等业务逻辑
 */

/**
 * 注册前台用户
 * @param data 用户注册信息
 * @returns 注册成功后的 token 和用户信息
 */
export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
  nickname?: string;
}) {
  const existingByUsername = await queryOne<{ id: number }>(
    'SELECT id FROM users WHERE username = ? LIMIT 1',
    [data.username],
  );

  const existingByEmail = await queryOne<{ id: number }>(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [data.email],
  );

  if (existingByUsername) {
    throw new Error('用户名已存在');
  }

  if (existingByEmail) {
    throw new Error('邮箱已存在');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const result = await execute(
    `INSERT INTO users
      (username, email, password_hash, nickname, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
    [data.username, data.email, passwordHash, data.nickname ?? null],
  );

  const user = await queryOne<{
    id: number;
    username: string;
    email: string;
    nickname: string | null;
    avatar: string | null;
    bio: string | null;
    status: number;
    createdAt: Date;
  }>(
    `SELECT
      id,
      username,
      email,
      nickname,
      avatar,
      bio,
      status,
      created_at AS createdAt
    FROM users
    WHERE id = ?
    LIMIT 1`,
    [Number((result as { insertId: number }).insertId)],
  );

  if (!user) {
    throw new Error('用户创建失败');
  }

  const token = signToken({ userId: user.id });

  return {
    token,
    userInfo: user,
  };
}

/**
 * 前台用户登录
 * @param account 用户名或邮箱
 * @param password 用户密码
 * @returns 登录成功返回 token 和用户信息，失败返回 null
 */
export async function loginUser(account: string, password: string) {
  const user = await queryOne<UserRecord>(
    `SELECT
      id,
      username,
      email,
      password_hash AS passwordHash,
      nickname,
      avatar,
      bio,
      status,
      last_login_at AS lastLoginAt,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM users
    WHERE username = ? OR email = ?
    LIMIT 1`,
    [account, account],
  );

  if (!user) {
    return null;
  }

  if (user.status !== 1) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return null;
  }

  await execute('UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = ?', [user.id]);

  const token = signToken({ userId: user.id });

  return {
    token,
    userInfo: {
      id: user.id,
      username: user.username,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      bio: user.bio,
      status: user.status,
    },
  };
}

/**
 * 获取当前登录用户信息
 * @param userId 用户 ID
 * @returns 用户信息，若不存在则返回 null
 */
export async function getCurrentUserProfile(userId: number) {
  return queryOne<Omit<UserRecord, 'passwordHash'>>(
    `SELECT
      id,
      username,
      email,
      nickname,
      avatar,
      bio,
      status,
      last_login_at AS lastLoginAt,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM users
    WHERE id = ?
    LIMIT 1`,
    [userId],
  );
}

/**
 * 获取前台用户列表
 * @returns 前台用户列表
 */
export async function getUserList() {
  return queryRows<Omit<UserRecord, 'passwordHash' | 'updatedAt'>>(
    `SELECT
      id,
      username,
      email,
      nickname,
      avatar,
      bio,
      status,
      last_login_at AS lastLoginAt,
      created_at AS createdAt
    FROM users
    ORDER BY created_at DESC`,
  );
}

/**
 * 更新前台用户状态
 * @param id 用户 ID
 * @param status 状态值
 * @returns 更新后的用户信息
 */
export async function updateUserStatus(id: number, status: number) {
  await execute('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);

  return queryOne<{
    id: number;
    username: string;
    email: string;
    nickname: string | null;
    status: number;
    updatedAt: Date;
  }>(
    `SELECT
      id,
      username,
      email,
      nickname,
      status,
      updated_at AS updatedAt
    FROM users
    WHERE id = ?
    LIMIT 1`,
    [id],
  );
}
