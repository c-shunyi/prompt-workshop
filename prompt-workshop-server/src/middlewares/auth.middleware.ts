import { Response, NextFunction } from 'express';
import { verifyToken, verifyAdminToken } from '../utils/jwt';
import { fail } from '../utils/response';
import { AuthRequest, AdminAuthRequest } from '../types';

/**
 * 客户端 JWT 鉴权中间件
 * 从 Authorization Header 中提取 Bearer Token 并校验
 * 校验通过后将用户信息挂载到 req.user
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    fail(res, '未提供有效的认证令牌', 401, 401);
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    fail(res, '认证令牌无效或已过期', 401, 401);
  }
}

/**
 * 管理台 JWT 鉴权中间件
 * 从 Authorization Header 中提取 Bearer Token 并使用管理台密钥校验
 * 校验通过后将管理员信息挂载到 req.admin
 */
export function adminAuthMiddleware(req: AdminAuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    fail(res, '未提供有效的管理员认证令牌', 401, 401);
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyAdminToken(token);
    req.admin = payload;
    next();
  } catch {
    fail(res, '管理员认证令牌无效或已过期', 401, 401);
  }
}
