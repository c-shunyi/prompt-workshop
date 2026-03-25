import { Router } from 'express';
import * as exampleController from '../../controllers/admin/example.controller';
import { adminAuthMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { AdminRole } from '../../types';

/**
 * 管理台示例路由
 * 挂载路径：/api/admin/examples
 * 所有接口均需管理台鉴权 + 角色权限校验
 */
const router = Router();

/** 管理台鉴权 + 角色校验中间件（admin 和 super_admin 均可访问） */
const authAndRole = [
  adminAuthMiddleware,
  requireRole([AdminRole.ADMIN, AdminRole.SUPER_ADMIN]),
];

/** 获取列表 - GET /api/admin/examples */
router.get('/', ...authAndRole, exampleController.getList);

/** 获取详情 - GET /api/admin/examples/:id */
router.get('/:id', ...authAndRole, exampleController.getById);

/** 创建记录 - POST /api/admin/examples */
router.post('/', ...authAndRole, exampleController.create);

/** 更新记录 - PUT /api/admin/examples/:id */
router.put('/:id', ...authAndRole, exampleController.update);

/** 删除记录 - DELETE /api/admin/examples/:id */
router.delete('/:id', ...authAndRole, exampleController.remove);

export default router;
