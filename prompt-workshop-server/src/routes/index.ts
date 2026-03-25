import { Router, Request, Response } from 'express';
import apiExampleRoute from './api/example.route';
import adminExampleRoute from './admin/example.route';
import adminUserRoute from './admin/admin-user.route';
import { success } from '../utils/response';

/**
 * 路由汇总
 * 挂载客户端 /api 和管理台 /api/admin 两套路由
 */
const router = Router();

// ==================== 客户端 API ====================

/** 健康检查 - GET /api/health */
router.get('/health', (_req: Request, res: Response) => {
  success(res, { status: 'ok', timestamp: new Date().toISOString() });
});

/** 客户端示例 CRUD - /api/examples */
router.use('/examples', apiExampleRoute);

// ==================== 管理台 API ====================

/** 管理员用户相关（登录、管理员管理） - /api/admin */
router.use('/admin', adminUserRoute);

/** 管理台示例 CRUD - /api/admin/examples */
router.use('/admin/examples', adminExampleRoute);

export default router;
