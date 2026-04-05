import { Request, Response, NextFunction } from 'express';
import * as userService from '../../services/user.service';
import { success, fail } from '../../utils/response';

/**
 * 管理台前台用户控制器
 * 处理前台用户列表与状态管理接口
 */

/** 获取前台用户列表 */
export async function getUserList(_req: Request, res: Response, next: NextFunction) {
  try {
    const list = await userService.getUserList();
    success(res, list);
  } catch (err) {
    next(err);
  }
}

/** 更新前台用户状态 */
export async function updateUserStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      fail(res, '无效的用户 ID', 400);
      return;
    }

    if (![0, 1].includes(Number(status))) {
      fail(res, '用户状态仅支持 0 或 1', 400);
      return;
    }

    const user = await userService.updateUserStatus(id, Number(status));
    success(res, user, '状态更新成功');
  } catch (err) {
    next(err);
  }
}
