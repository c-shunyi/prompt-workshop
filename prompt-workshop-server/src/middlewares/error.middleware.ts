import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * 全局错误处理中间件
 * 统一捕获异常，返回标准错误格式
 * 必须放在所有路由之后注册
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error('Unhandled error:', err.message, err.stack);

  res.status(200).json({
    code: 500,
    message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
    data: null,
  });
}
