import { Router, type Router as ExpressRouter } from 'express';
import * as userController from '../../controllers/admin/user.controller';
import { adminAuthMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { AdminRole } from '../../types';

/**
 * 管理台前台用户路由
 * 挂载路径：/api/admin/users
 */
const router: ExpressRouter = Router();

/** 获取前台用户列表 - GET /api/admin/users */
router.get(
  '/',
  adminAuthMiddleware,
  requireRole([AdminRole.ADMIN, AdminRole.SUPER_ADMIN]),
  userController.getUserList
);

/** 更新前台用户状态 - PATCH /api/admin/users/:id/status */
router.patch(
  '/:id/status',
  adminAuthMiddleware,
  requireRole([AdminRole.ADMIN, AdminRole.SUPER_ADMIN]),
  userController.updateUserStatus
);

export default router;
