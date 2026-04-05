import { Request, Response, NextFunction } from 'express';
import * as userService from '../../services/user.service';
import { AuthRequest } from '../../types';
import { success, fail } from '../../utils/response';

/**
 * 前台用户控制器
 * 处理注册、登录、获取个人信息等接口
 */

/** 用户注册 */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, email, password, nickname } = req.body;

    if (!username || !email || !password) {
      fail(res, '用户名、邮箱和密码不能为空', 400);
      return;
    }

    const result = await userService.registerUser({ username, email, password, nickname });
    success(res, result, '注册成功');
  } catch (err) {
    if (err instanceof Error && ['用户名已存在', '邮箱已存在'].includes(err.message)) {
      fail(res, err.message, 400);
      return;
    }

    next(err);
  }
}

/** 用户登录 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { account, password } = req.body;

    if (!account || !password) {
      fail(res, '用户名/邮箱和密码不能为空', 400);
      return;
    }

    const result = await userService.loginUser(account, password);
    if (!result) {
      fail(res, '账号不存在、密码错误，或账号已被禁用', 401);
      return;
    }

    success(res, result, '登录成功');
  } catch (err) {
    next(err);
  }
}

/** 获取当前登录用户信息 */
export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      fail(res, '未获取到用户信息，请先登录', 401, 401);
      return;
    }

    const profile = await userService.getCurrentUserProfile(userId);
    if (!profile) {
      fail(res, '用户不存在', 404);
      return;
    }

    success(res, profile);
  } catch (err) {
    next(err);
  }
}
