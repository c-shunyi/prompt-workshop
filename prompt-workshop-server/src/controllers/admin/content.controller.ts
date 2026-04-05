import { NextFunction, Request, Response } from 'express';
import * as contentService from '../../services/content.service';
import { fail, success } from '../../utils/response';

function parseStatus(value: unknown) {
  return value === undefined ? undefined : Number(value);
}

export async function getCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const list = await contentService.listAdminCategories();
    success(res, list);
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, slug, sort, status } = req.body;

    if (!name || !slug) {
      fail(res, '分类名称和 slug 不能为空', 400);
      return;
    }

    const category = await contentService.createCategory({
      name,
      slug,
      sort: sort !== undefined ? Number(sort) : undefined,
      status: parseStatus(status),
    });

    success(res, category, '分类创建成功');
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const categoryId = Number(req.params.id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      fail(res, '无效的分类 ID', 400);
      return;
    }

    const category = await contentService.updateCategory(categoryId, {
      name: req.body.name,
      slug: req.body.slug,
      sort: req.body.sort !== undefined ? Number(req.body.sort) : undefined,
      status: parseStatus(req.body.status),
    });

    success(res, category, '分类更新成功');
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const categoryId = Number(req.params.id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      fail(res, '无效的分类 ID', 400);
      return;
    }

    const result = await contentService.deleteCategory(categoryId);
    success(res, result, '分类删除成功');
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

export async function createTag(req: Request, res: Response, next: NextFunction) {
  try {
    const { name } = req.body;

    if (!name) {
      fail(res, '标签名称不能为空', 400);
      return;
    }

    const tag = await contentService.createTag({ name });
    success(res, tag, '标签创建成功');
  } catch (error) {
    next(error);
  }
}

export async function updateTag(req: Request, res: Response, next: NextFunction) {
  try {
    const tagId = Number(req.params.id);

    if (!Number.isInteger(tagId) || tagId <= 0) {
      fail(res, '无效的标签 ID', 400);
      return;
    }

    const tag = await contentService.updateTag(tagId, {
      name: req.body.name,
    });

    success(res, tag, '标签更新成功');
  } catch (error) {
    next(error);
  }
}

export async function getArticles(req: Request, res: Response, next: NextFunction) {
  try {
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : undefined;
    const status = req.query.status !== undefined ? Number(req.query.status) : undefined;
    const list = await contentService.listAdminArticles({ keyword, status });
    success(res, list);
  } catch (error) {
    next(error);
  }
}

export async function updateArticleStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const articleId = Number(req.params.id);
    const status = Number(req.body.status);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      fail(res, '无效的文章 ID', 400);
      return;
    }

    const article = await contentService.updateAdminArticleStatus(articleId, status);
    success(res, article, '文章状态更新成功');
  } catch (error) {
    next(error);
  }
}
