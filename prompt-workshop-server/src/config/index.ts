import dotenv from 'dotenv';

dotenv.config();

/**
 * 应用配置汇总
 * 从环境变量读取所有配置项，提供默认值
 */
export const config = {
  /** 服务端口 */
  port: parseInt(process.env.PORT || '3000', 10),

  /** 运行环境 */
  nodeEnv: process.env.NODE_ENV || 'development',

  /** 客户端 JWT 配置 */
  jwt: {
    secret: process.env.JWT_SECRET || 'default-jwt-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  /** 管理台 JWT 配置 */
  jwtAdmin: {
    secret: process.env.JWT_ADMIN_SECRET || 'default-admin-jwt-secret',
    expiresIn: process.env.JWT_ADMIN_EXPIRES_IN || '1d',
  },
};

export default config;
