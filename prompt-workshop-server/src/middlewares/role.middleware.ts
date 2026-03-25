import { Response, NextFunction } from 'express';
import { fail } from '../utils/response';
import { AdminAuthRequest, AdminRole } from '../types';

/**
 * 角色权限校验中间件工厂函数
 * 根据传入的允许角色列表，校验当前管理员是否具备访问权限
 * 必须在 adminAuthMiddleware 之后使用
 *
 * @param allowedRoles 允许访问的角色列表
 * @returns Express 中间件函数
 *
 * @example
 * // 仅超级管理员可访问
 * router.get('/sensitive', adminAuthMiddleware, requireRole([AdminRole.SUPER_ADMIN]), handler);
 *
 * // admin 和 super_admin 均可访问
 * router.get('/list', adminAuthMiddleware, requireRole([AdminRole.ADMIN, AdminRole.SUPER_ADMIN]), handler);
 */
export function requireRole(allowedRoles: AdminRole[]) {
  return (req: AdminAuthRequest, res: Response, next: NextFunction): void => {
    const admin = req.admin;

    if (!admin) {
      fail(res, '未获取到管理员信息，请先完成鉴权', 401, 401);
      return;
    }

    if (!allowedRoles.includes(admin.role)) {
      fail(res, '权限不足，无法访问该资源', 403, 403);
      return;
    }

    next();
  };
}
