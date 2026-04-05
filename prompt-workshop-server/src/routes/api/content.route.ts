import { Router, type Router as ExpressRouter } from 'express';
import * as contentController from '../../controllers/api/content.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router: ExpressRouter = Router();

router.get('/categories', contentController.getCategories);
router.get('/tags', contentController.getTags);
router.get('/articles', contentController.getArticles);
router.get('/articles/mine', authMiddleware, contentController.getMyArticles);
router.get('/articles/:id/edit', authMiddleware, contentController.getEditableArticle);
router.get('/articles/:id', contentController.getArticleDetail);
router.post('/articles', authMiddleware, contentController.createArticle);
router.patch('/articles/:id', authMiddleware, contentController.updateArticle);
router.post('/articles/:id/like', authMiddleware, contentController.toggleLike);
router.post('/articles/:id/favorite', authMiddleware, contentController.toggleFavorite);

export default router;
