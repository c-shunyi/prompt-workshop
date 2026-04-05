import {
  execute,
  queryOne,
  queryRows,
  withTransaction,
} from '../db/client';

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  sort: number;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TagItem {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArticleTagItem {
  id: number;
  name: string;
}

export interface ArticleListItem {
  id: number;
  userId: number;
  categoryId: number | null;
  title: string;
  summary: string | null;
  content?: string;
  status: number;
  viewCount: number;
  likeCount: number;
  favoriteCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  authorUsername: string;
  authorNickname: string | null;
  categoryName: string | null;
  tags: ArticleTagItem[];
  liked?: boolean;
  favorited?: boolean;
}

interface ArticleRow {
  id: number;
  userId: number;
  categoryId: number | null;
  title: string;
  summary: string | null;
  content?: string;
  status: number;
  viewCount: number;
  likeCount: number;
  favoriteCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  authorUsername: string;
  authorNickname: string | null;
  categoryName: string | null;
}

interface TagJoinRow {
  articleId: number;
  id: number;
  name: string;
}

interface InteractionRow {
  articleId: number;
}

export interface ArticleMutationInput {
  title: string;
  summary?: string | null;
  content: string;
  categoryId?: number | null;
  tagIds?: number[];
  status?: number;
}

export interface AdminArticleMutationInput extends ArticleMutationInput {
  userId: number;
}

function normalizeTagIds(tagIds: number[] = []) {
  return [...new Set(tagIds.filter((id) => Number.isInteger(id) && id > 0))];
}

function ensureArticleStatus(status: number | undefined, fallback = 0) {
  if (status === undefined) {
    return fallback;
  }

  if (![0, 1, 2].includes(status)) {
    throw new Error('文章状态仅支持 0、1、2');
  }

  return status;
}

async function ensureCategoryExists(categoryId?: number | null) {
  if (!categoryId) {
    return;
  }

  const category = await queryOne<{ id: number }>(
    'SELECT id FROM categories WHERE id = ? LIMIT 1',
    [categoryId],
  );

  if (!category) {
    throw new Error('分类不存在');
  }
}

async function ensureUserExists(userId: number) {
  const user = await queryOne<{ id: number }>(
    'SELECT id FROM users WHERE id = ? LIMIT 1',
    [userId],
  );

  if (!user) {
    throw new Error('文章作者不存在');
  }
}

async function ensureTagsExist(tagIds: number[]) {
  if (!tagIds.length) {
    return;
  }

  const placeholders = tagIds.map(() => '?').join(', ');
  const rows = await queryRows<{ id: number }>(
    `SELECT id FROM tags WHERE id IN (${placeholders})`,
    tagIds,
  );

  if (rows.length !== tagIds.length) {
    throw new Error('标签不存在或已失效');
  }
}

async function syncArticleTags(articleId: number, tagIds: number[], executor?: Parameters<typeof execute>[2]) {
  await execute('DELETE FROM article_tags WHERE article_id = ?', [articleId], executor);

  if (!tagIds.length) {
    return;
  }

  for (const tagId of tagIds) {
    await execute(
      'INSERT INTO article_tags (article_id, tag_id, created_at) VALUES (?, ?, NOW())',
      [articleId, tagId],
      executor,
    );
  }
}

async function getArticleTagsMap(articleIds: number[], executor?: Parameters<typeof queryRows>[2]) {
  if (!articleIds.length) {
    return new Map<number, ArticleTagItem[]>();
  }

  const placeholders = articleIds.map(() => '?').join(', ');
  const rows = await queryRows<TagJoinRow>(
    `SELECT
      at.article_id AS articleId,
      t.id,
      t.name
    FROM article_tags at
    INNER JOIN tags t ON t.id = at.tag_id
    WHERE at.article_id IN (${placeholders})
    ORDER BY t.name ASC`,
    articleIds,
    executor,
  );

  const map = new Map<number, ArticleTagItem[]>();

  rows.forEach((row) => {
    const list = map.get(row.articleId) ?? [];
    list.push({ id: row.id, name: row.name });
    map.set(row.articleId, list);
  });

  return map;
}

async function getInteractionSet(
  tableName: 'article_likes' | 'article_favorites',
  articleIds: number[],
  userId?: number,
  executor?: Parameters<typeof queryRows>[2],
) {
  if (!userId || !articleIds.length) {
    return new Set<number>();
  }

  const placeholders = articleIds.map(() => '?').join(', ');
  const rows = await queryRows<InteractionRow>(
    `SELECT article_id AS articleId
    FROM ${tableName}
    WHERE user_id = ?
      AND article_id IN (${placeholders})`,
    [userId, ...articleIds],
    executor,
  );

  return new Set(rows.map((row) => row.articleId));
}

async function enrichArticles(
  rows: ArticleRow[],
  userId?: number,
  executor?: Parameters<typeof queryRows>[2],
): Promise<ArticleListItem[]> {
  const articleIds = rows.map((row) => row.id);
  const tagsMap = await getArticleTagsMap(articleIds, executor);
  const likedSet = await getInteractionSet('article_likes', articleIds, userId, executor);
  const favoriteSet = await getInteractionSet('article_favorites', articleIds, userId, executor);

  return rows.map((row) => ({
    ...row,
    tags: tagsMap.get(row.id) ?? [],
    liked: likedSet.has(row.id),
    favorited: favoriteSet.has(row.id),
  }));
}

function buildArticleWhereClause(filters: {
  status?: number;
  userId?: number;
  categoryId?: number;
  keyword?: string;
}) {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filters.status !== undefined) {
    clauses.push('a.status = ?');
    params.push(filters.status);
  }

  if (filters.userId !== undefined) {
    clauses.push('a.user_id = ?');
    params.push(filters.userId);
  }

  if (filters.categoryId) {
    clauses.push('a.category_id = ?');
    params.push(filters.categoryId);
  }

  if (filters.keyword) {
    clauses.push('(a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ?)');
    const keyword = `%${filters.keyword}%`;
    params.push(keyword, keyword, keyword);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return { whereSql, params };
}

function articleBaseSelect(includeContent = false) {
  return `SELECT
    a.id,
    a.user_id AS userId,
    a.category_id AS categoryId,
    a.title,
    a.summary,
    ${includeContent ? 'a.content,' : ''}
    a.status,
    a.view_count AS viewCount,
    a.like_count AS likeCount,
    a.favorite_count AS favoriteCount,
    a.published_at AS publishedAt,
    a.created_at AS createdAt,
    a.updated_at AS updatedAt,
    u.username AS authorUsername,
    u.nickname AS authorNickname,
    c.name AS categoryName
  FROM articles a
  INNER JOIN users u ON u.id = a.user_id
  LEFT JOIN categories c ON c.id = a.category_id`;
}

export async function listPublicCategories() {
  return queryRows<CategoryItem>(
    `SELECT
      id,
      name,
      slug,
      sort,
      status,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM categories
    WHERE status = 1
    ORDER BY sort DESC, created_at DESC`,
  );
}

export async function listAdminCategories() {
  return queryRows<CategoryItem>(
    `SELECT
      id,
      name,
      slug,
      sort,
      status,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM categories
    ORDER BY sort DESC, created_at DESC`,
  );
}

export async function createCategory(input: {
  name: string;
  slug: string;
  sort?: number;
  status?: number;
}) {
  const status = input.status !== undefined ? (input.status === 1 ? 1 : 0) : 1;
  const sort = Number.isInteger(input.sort) ? Number(input.sort) : 0;

  const result = await execute(
    `INSERT INTO categories (name, slug, sort, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, NOW(), NOW())`,
    [input.name, input.slug, sort, status],
  );

  return queryOne<CategoryItem>(
    `SELECT
      id,
      name,
      slug,
      sort,
      status,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM categories
    WHERE id = ?
    LIMIT 1`,
    [Number((result as { insertId: number }).insertId)],
  );
}

export async function updateCategory(
  id: number,
  input: { name?: string; slug?: string; sort?: number; status?: number },
) {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (input.name !== undefined) {
    fields.push('name = ?');
    params.push(input.name);
  }

  if (input.slug !== undefined) {
    fields.push('slug = ?');
    params.push(input.slug);
  }

  if (input.sort !== undefined) {
    fields.push('sort = ?');
    params.push(input.sort);
  }

  if (input.status !== undefined) {
    fields.push('status = ?');
    params.push(input.status === 1 ? 1 : 0);
  }

  if (!fields.length) {
    throw new Error('没有可更新的分类字段');
  }

  fields.push('updated_at = NOW()');
  params.push(id);

  await execute(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, params);

  return queryOne<CategoryItem>(
    `SELECT
      id,
      name,
      slug,
      sort,
      status,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM categories
    WHERE id = ?
    LIMIT 1`,
    [id],
  );
}

export async function deleteCategory(id: number) {
  const category = await queryOne<CategoryItem>(
    `SELECT
      id,
      name,
      slug,
      sort,
      status,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM categories
    WHERE id = ?
    LIMIT 1`,
    [id],
  );

  if (!category) {
    throw new Error('分类不存在');
  }

  const articleCount = await queryOne<{ total: number }>(
    `SELECT CAST(COUNT(*) AS SIGNED) AS total
    FROM articles
    WHERE category_id = ?`,
    [id],
  );

  await execute('DELETE FROM categories WHERE id = ?', [id]);

  return {
    id,
    affectedArticles: articleCount?.total ?? 0,
  };
}

export async function listTags() {
  return queryRows<TagItem>(
    `SELECT
      id,
      name,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM tags
    ORDER BY created_at DESC`,
  );
}

export async function createTag(input: { name: string }) {
  const result = await execute(
    'INSERT INTO tags (name, created_at, updated_at) VALUES (?, NOW(), NOW())',
    [input.name],
  );

  return queryOne<TagItem>(
    `SELECT
      id,
      name,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM tags
    WHERE id = ?
    LIMIT 1`,
    [Number((result as { insertId: number }).insertId)],
  );
}

export async function updateTag(id: number, input: { name?: string }) {
  if (!input.name) {
    throw new Error('标签名称不能为空');
  }

  await execute('UPDATE tags SET name = ?, updated_at = NOW() WHERE id = ?', [input.name, id]);

  return queryOne<TagItem>(
    `SELECT
      id,
      name,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM tags
    WHERE id = ?
    LIMIT 1`,
    [id],
  );
}

export async function deleteTag(id: number) {
  const tag = await queryOne<TagItem>(
    `SELECT
      id,
      name,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM tags
    WHERE id = ?
    LIMIT 1`,
    [id],
  );

  if (!tag) {
    throw new Error('标签不存在');
  }

  const articleCount = await queryOne<{ total: number }>(
    `SELECT CAST(COUNT(DISTINCT article_id) AS SIGNED) AS total
    FROM article_tags
    WHERE tag_id = ?`,
    [id],
  );

  await execute('DELETE FROM tags WHERE id = ?', [id]);

  return {
    id,
    name: tag.name,
    affectedArticles: articleCount?.total ?? 0,
  };
}

export async function listPublicArticles(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  categoryId?: number;
  userId?: number;
}) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? Math.min(params.pageSize, 20) : 10;
  const offset = (page - 1) * pageSize;
  const { whereSql, params: whereParams } = buildArticleWhereClause({
    status: 1,
    categoryId: params.categoryId,
    keyword: params.keyword,
  });

  const [rows, totalRow] = await Promise.all([
    queryRows<ArticleRow>(
      `${articleBaseSelect(false)}
      ${whereSql}
      ORDER BY COALESCE(a.published_at, a.created_at) DESC
      LIMIT ? OFFSET ?`,
      [...whereParams, pageSize, offset],
    ),
    queryOne<{ total: number }>(
      `SELECT CAST(COUNT(*) AS SIGNED) AS total
      FROM articles a
      ${whereSql}`,
      whereParams,
    ),
  ]);

  return {
    list: await enrichArticles(rows, params.userId),
    total: totalRow?.total ?? 0,
    page,
    pageSize,
  };
}

export async function listUserArticles(userId: number) {
  const rows = await queryRows<ArticleRow>(
    `${articleBaseSelect(true)}
    WHERE a.user_id = ?
    ORDER BY a.updated_at DESC`,
    [userId],
  );

  return enrichArticles(rows, userId);
}

export async function listAdminArticles(params: { keyword?: string; status?: number }) {
  const { whereSql, params: whereParams } = buildArticleWhereClause({
    status: params.status,
    keyword: params.keyword,
  });

  const rows = await queryRows<ArticleRow>(
    `${articleBaseSelect(false)}
    ${whereSql}
    ORDER BY a.updated_at DESC`,
    whereParams,
  );

  return enrichArticles(rows);
}

export async function getPublishedArticleDetail(id: number, userId?: number) {
  const row = await queryOne<ArticleRow>(
    `${articleBaseSelect(true)}
    WHERE a.id = ? AND a.status = 1
    LIMIT 1`,
    [id],
  );

  if (!row) {
    return null;
  }

  await execute('UPDATE articles SET view_count = view_count + 1 WHERE id = ?', [id]);
  row.viewCount += 1;

  const [article] = await enrichArticles([row], userId);
  return article ?? null;
}

export async function getEditableArticle(
  userId: number,
  id: number,
  executor?: Parameters<typeof queryOne>[2],
) {
  const row = await queryOne<ArticleRow>(
    `${articleBaseSelect(true)}
    WHERE a.id = ? AND a.user_id = ?
    LIMIT 1`,
    [id, userId],
    executor,
  );

  if (!row) {
    return null;
  }

  const [article] = await enrichArticles([row], userId, executor);
  return article ?? null;
}

export async function getAdminEditableArticle(
  id: number,
  executor?: Parameters<typeof queryOne>[2],
) {
  const row = await queryOne<ArticleRow>(
    `${articleBaseSelect(true)}
    WHERE a.id = ?
    LIMIT 1`,
    [id],
    executor,
  );

  if (!row) {
    return null;
  }

  const [article] = await enrichArticles([row], undefined, executor);
  return article ?? null;
}

export async function createArticle(userId: number, input: ArticleMutationInput) {
  const tagIds = normalizeTagIds(input.tagIds);
  const status = ensureArticleStatus(input.status, 0);

  await ensureCategoryExists(input.categoryId);
  await ensureTagsExist(tagIds);

  return withTransaction(async (connection) => {
    const result = await execute(
      `INSERT INTO articles
        (user_id, category_id, title, summary, content, status, published_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userId,
        input.categoryId ?? null,
        input.title,
        input.summary ?? null,
        input.content,
        status,
        status === 1 ? new Date() : null,
      ],
      connection,
    );

    const articleId = Number((result as { insertId: number }).insertId);
    await syncArticleTags(articleId, tagIds, connection);

    return getEditableArticle(userId, articleId, connection);
  });
}

export async function updateArticle(userId: number, articleId: number, input: ArticleMutationInput) {
  const existing = await queryOne<{ id: number; status: number; publishedAt: Date | null }>(
    `SELECT
      id,
      status,
      published_at AS publishedAt
    FROM articles
    WHERE id = ? AND user_id = ?
    LIMIT 1`,
    [articleId, userId],
  );

  if (!existing) {
    throw new Error('文章不存在或无权编辑');
  }

  const tagIds = normalizeTagIds(input.tagIds);
  const status = ensureArticleStatus(input.status, existing.status);

  await ensureCategoryExists(input.categoryId);
  await ensureTagsExist(tagIds);

  return withTransaction(async (connection) => {
    await execute(
      `UPDATE articles
      SET category_id = ?, title = ?, summary = ?, content = ?, status = ?, published_at = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?`,
      [
        input.categoryId ?? null,
        input.title,
        input.summary ?? null,
        input.content,
        status,
        status === 1 ? existing.publishedAt ?? new Date() : null,
        articleId,
        userId,
      ],
      connection,
    );

    await syncArticleTags(articleId, tagIds, connection);
    return getEditableArticle(userId, articleId, connection);
  });
}

export async function createAdminArticle(input: AdminArticleMutationInput) {
  const tagIds = normalizeTagIds(input.tagIds);
  const status = ensureArticleStatus(input.status, 0);

  await ensureUserExists(input.userId);
  await ensureCategoryExists(input.categoryId);
  await ensureTagsExist(tagIds);

  return withTransaction(async (connection) => {
    const result = await execute(
      `INSERT INTO articles
        (user_id, category_id, title, summary, content, status, published_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        input.userId,
        input.categoryId ?? null,
        input.title,
        input.summary ?? null,
        input.content,
        status,
        status === 1 ? new Date() : null,
      ],
      connection,
    );

    const articleId = Number((result as { insertId: number }).insertId);
    await syncArticleTags(articleId, tagIds, connection);

    return getAdminEditableArticle(articleId, connection);
  });
}

export async function updateAdminArticle(articleId: number, input: AdminArticleMutationInput) {
  const existing = await queryOne<{ id: number; publishedAt: Date | null }>(
    `SELECT
      id,
      published_at AS publishedAt
    FROM articles
    WHERE id = ?
    LIMIT 1`,
    [articleId],
  );

  if (!existing) {
    throw new Error('文章不存在');
  }

  const tagIds = normalizeTagIds(input.tagIds);
  const status = ensureArticleStatus(input.status, 0);

  await ensureUserExists(input.userId);
  await ensureCategoryExists(input.categoryId);
  await ensureTagsExist(tagIds);

  return withTransaction(async (connection) => {
    await execute(
      `UPDATE articles
      SET user_id = ?, category_id = ?, title = ?, summary = ?, content = ?, status = ?, published_at = ?, updated_at = NOW()
      WHERE id = ?`,
      [
        input.userId,
        input.categoryId ?? null,
        input.title,
        input.summary ?? null,
        input.content,
        status,
        status === 1 ? existing.publishedAt ?? new Date() : null,
        articleId,
      ],
      connection,
    );

    await syncArticleTags(articleId, tagIds, connection);
    return getAdminEditableArticle(articleId, connection);
  });
}

async function ensureArticleExists(articleId: number) {
  const article = await queryOne<{ id: number }>('SELECT id FROM articles WHERE id = ? LIMIT 1', [articleId]);

  if (!article) {
    throw new Error('文章不存在');
  }
}

export async function toggleArticleLike(userId: number, articleId: number) {
  await ensureArticleExists(articleId);

  return withTransaction(async (connection) => {
    const exists = await queryOne<{ id: number }>(
      'SELECT id FROM article_likes WHERE article_id = ? AND user_id = ? LIMIT 1',
      [articleId, userId],
      connection,
    );

    if (exists) {
      await execute('DELETE FROM article_likes WHERE id = ?', [exists.id], connection);
    } else {
      await execute(
        'INSERT INTO article_likes (article_id, user_id, created_at) VALUES (?, ?, NOW())',
        [articleId, userId],
        connection,
      );
    }

    const totalRow = await queryOne<{ total: number }>(
      'SELECT CAST(COUNT(*) AS SIGNED) AS total FROM article_likes WHERE article_id = ?',
      [articleId],
      connection,
    );

    const likeCount = totalRow?.total ?? 0;
    await execute('UPDATE articles SET like_count = ? WHERE id = ?', [likeCount, articleId], connection);

    return {
      liked: !exists,
      likeCount,
    };
  });
}

export async function toggleArticleFavorite(userId: number, articleId: number) {
  await ensureArticleExists(articleId);

  return withTransaction(async (connection) => {
    const exists = await queryOne<{ id: number }>(
      'SELECT id FROM article_favorites WHERE article_id = ? AND user_id = ? LIMIT 1',
      [articleId, userId],
      connection,
    );

    if (exists) {
      await execute('DELETE FROM article_favorites WHERE id = ?', [exists.id], connection);
    } else {
      await execute(
        'INSERT INTO article_favorites (article_id, user_id, created_at) VALUES (?, ?, NOW())',
        [articleId, userId],
        connection,
      );
    }

    const totalRow = await queryOne<{ total: number }>(
      'SELECT CAST(COUNT(*) AS SIGNED) AS total FROM article_favorites WHERE article_id = ?',
      [articleId],
      connection,
    );

    const favoriteCount = totalRow?.total ?? 0;
    await execute('UPDATE articles SET favorite_count = ? WHERE id = ?', [favoriteCount, articleId], connection);

    return {
      favorited: !exists,
      favoriteCount,
    };
  });
}

export async function updateAdminArticleStatus(articleId: number, status: number) {
  const normalizedStatus = ensureArticleStatus(status);

  const existing = await queryOne<{ id: number; publishedAt: Date | null }>(
    'SELECT id, published_at AS publishedAt FROM articles WHERE id = ? LIMIT 1',
    [articleId],
  );

  if (!existing) {
    throw new Error('文章不存在');
  }

  await execute(
    `UPDATE articles
    SET status = ?, published_at = ?, updated_at = NOW()
    WHERE id = ?`,
    [normalizedStatus, normalizedStatus === 1 ? existing.publishedAt ?? new Date() : null, articleId],
  );

  const rows = await listAdminArticles({});
  return rows.find((item) => item.id === articleId) ?? null;
}

export async function deleteAdminArticle(articleId: number) {
  const existing = await queryOne<{ id: number; title: string }>(
    'SELECT id, title FROM articles WHERE id = ? LIMIT 1',
    [articleId],
  );

  if (!existing) {
    throw new Error('文章不存在');
  }

  await execute('DELETE FROM articles WHERE id = ?', [articleId]);

  return {
    id: existing.id,
    title: existing.title,
  };
}
