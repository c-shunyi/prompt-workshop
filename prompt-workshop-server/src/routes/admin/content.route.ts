import { Router, type Router as ExpressRouter } from 'express';
import * as contentController from '../../controllers/admin/content.controller';
import { adminAuthMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { AdminRole } from '../../types';

const router: ExpressRouter = Router();

router.use(adminAuthMiddleware, requireRole([AdminRole.ADMIN, AdminRole.SUPER_ADMIN]));

router.get('/categories', contentController.getCategories);
router.post('/categories', contentController.createCategory);
router.patch('/categories/:id', contentController.updateCategory);
router.delete('/categories/:id', contentController.deleteCategory);

router.get('/tags', contentController.getTags);
router.post('/tags', contentController.createTag);
router.patch('/tags/:id', contentController.updateTag);
router.delete('/tags/:id', contentController.deleteTag);

router.get('/articles', contentController.getArticles);
router.get('/articles/:id', contentController.getArticleDetail);
router.post('/articles', contentController.createArticle);
router.patch('/articles/:id', contentController.updateArticle);
router.patch('/articles/:id/status', contentController.updateArticleStatus);
router.delete('/articles/:id', contentController.deleteArticle);

export default router;
