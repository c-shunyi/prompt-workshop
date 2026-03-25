import app from './app';
import config from './config';
import logger from './utils/logger';

/**
 * 服务启动文件
 * 监听端口并启动 HTTP 服务
 */
const { port } = config;

app.listen(port, () => {
  logger.info(`🚀 Server is running on http://localhost:${port}`);
  logger.info(`📡 API base URL: http://localhost:${port}/api`);
  logger.info(`🔧 Admin API base URL: http://localhost:${port}/api/admin`);
  logger.info(`🌍 Environment: ${config.nodeEnv}`);
});
