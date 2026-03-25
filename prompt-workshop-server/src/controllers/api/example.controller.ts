import { Request, Response, NextFunction } from 'express';
import * as exampleService from '../../services/example.service';
import { success, fail } from '../../utils/response';

/**
 * 客户端示例控制器
 * 处理客户端 API 的 Example CRUD 请求
 */

/** 获取示例列表 */
export async function getList(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const result = await exampleService.getExampleList(page, pageSize);
    success(res, result);
  } catch (err) {
    next(err);
  }
}

/** 根据 ID 获取示例详情 */
export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const example = await exampleService.getExampleById(id);
    if (!example) {
      fail(res, '记录不存在', 404);
      return;
    }
    success(res, example);
  } catch (err) {
    next(err);
  }
}

/** 创建示例记录 */
export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description } = req.body;
    if (!title) {
      fail(res, 'title 为必填项', 400);
      return;
    }
    const example = await exampleService.createExample({ title, description });
    success(res, example, '创建成功');
  } catch (err) {
    next(err);
  }
}

/** 更新示例记录 */
export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const { title, description, status } = req.body;
    const example = await exampleService.updateExample(id, { title, description, status });
    success(res, example, '更新成功');
  } catch (err) {
    next(err);
  }
}

/** 删除示例记录 */
export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    await exampleService.deleteExample(id);
    success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}
