import { NextFunction, Request, Response } from 'express';
import * as contentService from '../../services/content.service';
import { fail, success } from '../../utils/response';

function parseStatus(value: unknown) {
  return value === undefined ? undefined : Number(value);
}

export async function getCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(_req.query.page);
    const pageSize = Number(_req.query.pageSize);
    const result = await contentService.listAdminCategories({ page, pageSize });
    success(res, result);
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
    const page = Number(_req.query.page);
    const pageSize = Number(_req.query.pageSize);
    const result = await contentService.listAdminTags({ page, pageSize });
    success(res, result);
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

export async function deleteTag(req: Request, res: Response, next: NextFunction) {
  try {
    const tagId = Number(req.params.id);

    if (!Number.isInteger(tagId) || tagId <= 0) {
      fail(res, '无效的标签 ID', 400);
      return;
    }

    const result = await contentService.deleteTag(tagId);
    success(res, result, '标签删除成功');
  } catch (error) {
    next(error);
  }
}

export async function getArticles(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page);
    const pageSize = Number(req.query.pageSize);
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : undefined;
    const parsedStatus = req.query.status !== undefined ? Number(req.query.status) : undefined;
    const status = parsedStatus !== undefined && [0, 1, 2].includes(parsedStatus) ? parsedStatus : undefined;
    const result = await contentService.listAdminArticles({ page, pageSize, keyword, status });
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

    const article = await contentService.getAdminEditableArticle(articleId);

    if (!article) {
      fail(res, '文章不存在', 404);
      return;
    }

    success(res, article);
  } catch (error) {
    next(error);
  }
}

export async function createArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, title, summary, content, categoryId, status } = req.body;

    if (!title || !content) {
      fail(res, '标题和正文不能为空', 400);
      return;
    }

    const article = await contentService.createAdminArticle({
      userId: userId ? Number(userId) : undefined,
      title,
      summary,
      content,
      categoryId: categoryId ? Number(categoryId) : null,
      tagIds: Array.isArray(req.body.tagIds) ? req.body.tagIds.map((item: unknown) => Number(item)) : [],
      status: status !== undefined ? Number(status) : undefined,
    });

    success(res, article, '文章创建成功');
  } catch (error) {
    next(error);
  }
}

export async function updateArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const articleId = Number(req.params.id);
    const { userId, title, summary, content, categoryId, status } = req.body;

    if (!Number.isInteger(articleId) || articleId <= 0) {
      fail(res, '无效的文章 ID', 400);
      return;
    }

    if (!title || !content) {
      fail(res, '标题和正文不能为空', 400);
      return;
    }

    const article = await contentService.updateAdminArticle(articleId, {
      userId: userId ? Number(userId) : undefined,
      title,
      summary,
      content,
      categoryId: categoryId ? Number(categoryId) : null,
      tagIds: Array.isArray(req.body.tagIds) ? req.body.tagIds.map((item: unknown) => Number(item)) : [],
      status: status !== undefined ? Number(status) : undefined,
    });

    success(res, article, '文章更新成功');
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

export async function deleteArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const articleId = Number(req.params.id);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      fail(res, '无效的文章 ID', 400);
      return;
    }

    const result = await contentService.deleteAdminArticle(articleId);
    success(res, result, '文章删除成功');
  } catch (error) {
    next(error);
  }
}
