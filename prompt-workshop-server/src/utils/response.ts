import { Response } from 'express';
import { ApiResponse } from '../types';

/**
 * 发送成功响应
 * @param res Express Response 对象
 * @param data 响应数据
 * @param message 成功消息
 */
export function success<T>(res: Response, data: T = null as T, message = 'success'): void {
  const body: ApiResponse<T> = {
    code: 0,
    message,
    data,
  };
  res.json(body);
}

/**
 * 发送失败响应
 * @param res Express Response 对象
 * @param message 错误消息
 * @param code 错误码，默认 500
 * @param httpStatus HTTP 状态码，默认 200（业务错误仍返回 200，通过 code 区分）
 */
export function fail(res: Response, message = '服务器内部错误', code = 500, httpStatus = 200): void {
  const body: ApiResponse<null> = {
    code,
    message,
    data: null,
  };
  res.status(httpStatus).json(body);
}
