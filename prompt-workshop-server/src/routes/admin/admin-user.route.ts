import { Router } from 'express';
import * as adminUserController from '../../controllers/admin/admin-user.controller';
import { adminAuthMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { AdminRole } from '../../types';

/**
 * 管理员用户路由
 * 挂载路径：/api/admin
 */
const router = Router();

/** 管理员登录（无需鉴权） - POST /api/admin/login */
router.post('/login', adminUserController.login);

/** 获取管理员列表（仅超级管理员） - GET /api/admin/admins */
router.get(
  '/admins',
  adminAuthMiddleware,
  requireRole([AdminRole.SUPER_ADMIN]),
  adminUserController.getAdminList
);

/** 创建管理员（仅超级管理员） - POST /api/admin/admins */
router.post(
  '/admins',
  adminAuthMiddleware,
  requireRole([AdminRole.SUPER_ADMIN]),
  adminUserController.createAdmin
);

export default router;
