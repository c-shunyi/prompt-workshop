/**
 * 简易日志工具
 * 根据运行环境输出不同级别的日志
 */

const isDev = process.env.NODE_ENV !== 'production';

/** 普通信息日志 */
export function info(message: string, ...args: unknown[]): void {
  console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
}

/** 警告日志 */
export function warn(message: string, ...args: unknown[]): void {
  console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
}

/** 错误日志 */
export function error(message: string, ...args: unknown[]): void {
  console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
}

/** 调试日志（仅开发环境输出） */
export function debug(message: string, ...args: unknown[]): void {
  if (isDev) {
    console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
  }
}

export default { info, warn, error, debug };
