import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../types';
import * as contentService from '../../services/content.service';
import { fail, success } from '../../utils/response';

function rejectPersonalPublishing(res: Response) {
  fail(res, '个人用户不能发布或编辑文章，请使用后台文章管理功能', 403, 403);
}

export async function getCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const list = await contentService.listPublicCategories();
    success(res, list);
  } catch (error) {
    next(error);
  }
}

export async function getTags(_req: Request, res: Response, next: NextFunction) {
  try {
    const list = await contentService.listTags();
    success(res, list);
  } catch (error) {
    next(error);
  }
}

export async function getArticles(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : undefined;

    const result = await contentService.listPublicArticles({
      page,
      pageSize,
      categoryId,
      keyword,
    });

    success(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getArticleDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const articleId = Number(req.params.id);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      fail(res, '无效的文章 ID', 400);
      return;
    }

    const article = await contentService.getPublishedArticleDetail(articleId);

    if (!article) {
      fail(res, '文章不存在或未发布', 404);
      return;
    }

    success(res, article);
  } catch (error) {
    next(error);
  }
}

export async function getMyArticles(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      fail(res, '未获取到用户信息，请先登录', 401, 401);
      return;
    }

    const list = await contentService.listUserArticles(userId);
    success(res, list);
  } catch (error) {
    next(error);
  }
}

export async function getEditableArticle(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      fail(res, '未获取到用户信息，请先登录', 401, 401);
      return;
    }

    rejectPersonalPublishing(res);
  } catch (error) {
    next(error);
  }
}

export async function createArticle(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      fail(res, '未获取到用户信息，请先登录', 401, 401);
      return;
    }

    rejectPersonalPublishing(res);
  } catch (error) {
    next(error);
  }
}

export async function updateArticle(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      fail(res, '未获取到用户信息，请先登录', 401, 401);
      return;
    }

    rejectPersonalPublishing(res);
  } catch (error) {
    next(error);
  }
}

export async function toggleLike(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const articleId = Number(req.params.id);

    if (!userId) {
      fail(res, '未获取到用户信息，请先登录', 401, 401);
      return;
    }

    if (!Number.isInteger(articleId) || articleId <= 0) {
      fail(res, '无效的文章 ID', 400);
      return;
    }

    const result = await contentService.toggleArticleLike(userId, articleId);
    success(res, result, result.liked ? '点赞成功' : '已取消点赞');
  } catch (error) {
    next(error);
  }
}

export async function toggleFavorite(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const articleId = Number(req.params.id);

    if (!userId) {
      fail(res, '未获取到用户信息，请先登录', 401, 401);
      return;
    }

    if (!Number.isInteger(articleId) || articleId <= 0) {
      fail(res, '无效的文章 ID', 400);
      return;
    }

    const result = await contentService.toggleArticleFavorite(userId, articleId);
    success(res, result, result.favorited ? '收藏成功' : '已取消收藏');
  } catch (error) {
    next(error);
  }
}
