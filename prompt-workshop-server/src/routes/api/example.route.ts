import { Router } from 'express';
import * as exampleController from '../../controllers/api/example.controller';

/**
 * 客户端示例路由
 * 挂载路径：/api/examples
 */
const router = Router();

/** 获取列表 - GET /api/examples */
router.get('/', exampleController.getList);

/** 获取详情 - GET /api/examples/:id */
router.get('/:id', exampleController.getById);

/** 创建记录 - POST /api/examples */
router.post('/', exampleController.create);

/** 更新记录 - PUT /api/examples/:id */
router.put('/:id', exampleController.update);

/** 删除记录 - DELETE /api/examples/:id */
router.delete('/:id', exampleController.remove);

export default router;
