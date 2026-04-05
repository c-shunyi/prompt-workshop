import { NextFunction, Request, Response } from 'express';
import * as dashboardService from '../../services/admin-dashboard.service';
import { success } from '../../utils/response';

export async function getOverview(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getAdminOverview();
    success(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getEditorOptions(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getEditorOptions();
    success(res, data);
  } catch (error) {
    next(error);
  }
}
