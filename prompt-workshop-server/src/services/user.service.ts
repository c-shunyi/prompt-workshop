import bcrypt from 'bcryptjs';
import prisma from '../prisma/client';
import { signToken } from '../utils/jwt';

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
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: data.username }, { email: data.email }],
    },
    select: {
      username: true,
      email: true,
    },
  });

  if (existingUser?.username === data.username) {
    throw new Error('用户名已存在');
  }

  if (existingUser?.email === data.email) {
    throw new Error('邮箱已存在');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      passwordHash,
      nickname: data.nickname,
    },
    select: {
      id: true,
      username: true,
      email: true,
      nickname: true,
      avatar: true,
      bio: true,
      status: true,
      createdAt: true,
    },
  });

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
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: account }, { email: account }],
    },
  });

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

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

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
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      nickname: true,
      avatar: true,
      bio: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * 获取前台用户列表
 * @returns 前台用户列表
 */
export async function getUserList() {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      nickname: true,
      avatar: true,
      bio: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * 更新前台用户状态
 * @param id 用户 ID
 * @param status 状态值
 * @returns 更新后的用户信息
 */
export async function updateUserStatus(id: number, status: number) {
  return prisma.user.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      username: true,
      email: true,
      nickname: true,
      status: true,
      updatedAt: true,
    },
  });
}
