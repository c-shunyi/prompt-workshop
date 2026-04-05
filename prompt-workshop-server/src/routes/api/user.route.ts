import { Router, type Router as ExpressRouter } from 'express';
import * as userController from '../../controllers/api/user.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

/**
 * 前台用户路由
 * 挂载路径：/api/users
 */
const router: ExpressRouter = Router();

/** 用户注册 - POST /api/users/register */
router.post('/register', userController.register);

/** 用户登录 - POST /api/users/login */
router.post('/login', userController.login);

/** 获取当前登录用户信息 - GET /api/users/me */
router.get('/me', authMiddleware, userController.getProfile);

export default router;
