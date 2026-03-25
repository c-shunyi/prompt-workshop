import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import config from './config';

/**
 * Express 应用入口
 * 配置中间件、挂载路由、注册全局错误处理
 */
const app = express();

// ==================== 基础中间件 ====================

/** CORS 跨域 */
app.use(cors());

/** 请求体解析 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/** HTTP 请求日志（开发环境使用 dev 格式） */
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));

// ==================== 路由挂载 ====================

/** 所有接口统一在 /api 下 */
app.use('/api', routes);

// ==================== 全局错误处理 ====================

/** 必须在所有路由之后注册 */
app.use(errorHandler);

export default app;
