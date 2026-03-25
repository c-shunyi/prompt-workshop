import jwt from 'jsonwebtoken';
import config from '../config';
import { JwtPayload, AdminJwtPayload } from '../types';

/**
 * 签发客户端用户 JWT Token
 * @param payload JWT 载荷
 * @returns 签发的 Token 字符串
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/**
 * 验证客户端用户 JWT Token
 * @param token 待验证的 Token 字符串
 * @returns 解析后的载荷
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
}

/**
 * 签发管理台用户 JWT Token
 * @param payload 管理台 JWT 载荷
 * @returns 签发的 Token 字符串
 */
export function signAdminToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, config.jwtAdmin.secret, {
    expiresIn: config.jwtAdmin.expiresIn,
  });
}

/**
 * 验证管理台用户 JWT Token
 * @param token 待验证的 Token 字符串
 * @returns 解析后的管理台载荷
 */
export function verifyAdminToken(token: string): AdminJwtPayload {
  return jwt.verify(token, config.jwtAdmin.secret) as AdminJwtPayload;
}
