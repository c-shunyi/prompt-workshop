import { Router, type Router as ExpressRouter } from 'express';
import * as dashboardController from '../../controllers/admin/dashboard.controller';
import { adminAuthMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { AdminRole } from '../../types';

const router: ExpressRouter = Router();

router.use(adminAuthMiddleware, requireRole([AdminRole.ADMIN, AdminRole.SUPER_ADMIN]));

router.get('/overview', dashboardController.getOverview);
router.get('/editor-options', dashboardController.getEditorOptions);

export default router;
