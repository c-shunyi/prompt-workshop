import { Router, Request, Response, type Router as ExpressRouter } from 'express';
import apiContentRoute from './api/content.route';
import apiExampleRoute from './api/example.route';
import apiUserRoute from './api/user.route';
import adminContentRoute from './admin/content.route';
import adminExampleRoute from './admin/example.route';
import adminUserRoute from './admin/admin-user.route';
import adminWebUserRoute from './admin/user.route';
import { success } from '../utils/response';

/**
 * 路由汇总
 * 挂载客户端 /api 和管理台 /api/admin 两套路由
 */
const router: ExpressRouter = Router();

// ==================== 客户端 API ====================

/** 健康检查 - GET /api/health */
router.get('/health', (_req: Request, res: Response) => {
  success(res, { status: 'ok', timestamp: new Date().toISOString() });
});

/** 客户端示例 CRUD - /api/examples */
router.use('/examples', apiExampleRoute);

/** 客户端用户相关 - /api/users */
router.use('/users', apiUserRoute);

/** 客户端内容相关 */
router.use('/', apiContentRoute);

// ==================== 管理台 API ====================

/** 管理员用户相关（登录、管理员管理） - /api/admin */
router.use('/admin', adminUserRoute);

/** 管理台示例 CRUD - /api/admin/examples */
router.use('/admin/examples', adminExampleRoute);

/** 管理台前台用户管理 - /api/admin/users */
router.use('/admin/users', adminWebUserRoute);

/** 管理台内容管理 */
router.use('/admin', adminContentRoute);

export default router;
