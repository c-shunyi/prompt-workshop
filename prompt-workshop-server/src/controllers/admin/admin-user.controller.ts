import { Request, Response, NextFunction } from 'express';
import * as adminUserService from '../../services/admin-user.service';
import { success, fail } from '../../utils/response';
import { AdminAuthRequest } from '../../types';

/**
 * 管理员用户控制器
 * 处理管理员登录、管理员列表等接口
 */

/** 管理员登录（无需鉴权） */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      fail(res, '用户名和密码不能为空', 400);
      return;
    }

    const result = await adminUserService.adminLogin(username, password);
    if (!result) {
      fail(res, '用户名或密码错误，或账号已被禁用', 401);
      return;
    }

    success(res, result, '登录成功');
  } catch (err) {
    next(err);
  }
}

/** 获取管理员列表（需超级管理员权限） */
export async function getAdminList(_req: AdminAuthRequest, res: Response, next: NextFunction) {
  try {
    const list = await adminUserService.getAdminList();
    success(res, list);
  } catch (err) {
    next(err);
  }
}

/** 创建管理员（需超级管理员权限） */
export async function createAdmin(req: AdminAuthRequest, res: Response, next: NextFunction) {
  try {
    const { username, password, nickname, role } = req.body;

    if (!username || !password) {
      fail(res, '用户名和密码不能为空', 400);
      return;
    }

    const admin = await adminUserService.createAdmin({ username, password, nickname, role });
    success(res, admin, '创建成功');
  } catch (err) {
    next(err);
  }
}
