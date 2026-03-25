import bcrypt from 'bcryptjs';
import prisma from '../prisma/client';
import { signAdminToken } from '../utils/jwt';
import { AdminRole } from '../types';

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
  const admin = await prisma.adminUser.findUnique({ where: { username } });

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
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

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
export async function getAdminList() {
  return prisma.adminUser.findMany({
    select: {
      id: true,
      username: true,
      nickname: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
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

  const admin = await prisma.adminUser.create({
    data: {
      username: data.username,
      passwordHash,
      nickname: data.nickname,
      role: data.role || AdminRole.ADMIN,
    },
    select: {
      id: true,
      username: true,
      nickname: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return admin;
}
