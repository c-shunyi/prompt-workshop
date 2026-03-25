import { Request } from 'express';

/**
 * 管理员角色枚举
 */
export enum AdminRole {
  /** 普通管理员 */
  ADMIN = 'admin',
  /** 超级管理员 */
  SUPER_ADMIN = 'super_admin',
}

/**
 * JWT 载荷类型 - 客户端用户
 */
export interface JwtPayload {
  userId: number;
  [key: string]: unknown;
}

/**
 * JWT 载荷类型 - 管理台用户
 */
export interface AdminJwtPayload {
  adminId: number;
  username: string;
  role: AdminRole;
}

/**
 * 扩展 Express Request，附加鉴权信息
 */
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * 扩展 Express Request，附加管理台鉴权信息
 */
export interface AdminAuthRequest extends Request {
  admin?: AdminJwtPayload;
}

/**
 * 统一响应结构
 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}
