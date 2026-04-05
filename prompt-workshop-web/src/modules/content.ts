import { reactive } from 'vue'
import { API_BASE, authState, setFeedback } from './auth'

export type CategoryItem = {
  id: number
  name: string
  slug: string
  sort: number
  status: number
}

export type TagItem = {
  id: number
  name: string
}

export type ArticleTag = {
  id: number
  name: string
}

export type ArticleItem = {
  id: number
  userId: number
  categoryId: number | null
  title: string
  summary?: string | null
  content?: string
  status: number
  viewCount: number
  likeCount: number
  favoriteCount: number
  publishedAt?: string | null
  createdAt?: string
  updatedAt?: string
  authorUsername: string
  authorNickname?: string | null
  categoryName?: string | null
  tags: ArticleTag[]
  liked?: boolean
  favorited?: boolean
}

type ApiResponse<T> = {
  code: number
  message: string
  data: T | null
}

type ArticleListPayload = {
  list: ArticleItem[]
  total: number
  page: number
  pageSize: number
}

export const contentState = reactive({
  categories: [] as CategoryItem[],
  tags: [] as TagItem[],
  homeArticles: [] as ArticleItem[],
  myArticles: [] as ArticleItem[],
  articleDetail: null as ArticleItem | null,
  homeLoading: false,
  metaLoading: false,
  myArticlesLoading: false,
  detailLoading: false,
  editorLoading: false,
  saving: false,
})

async function request<T>(path: string, init?: RequestInit, authToken?: string) {
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')

  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })

  const payload = (await response.json()) as ApiResponse<T>

  if (!response.ok || payload.code !== 0 || payload.data === null) {
    throw new Error(payload.message || '请求失败')
  }

  return payload.data
}

function patchArticleInCollections(article: Partial<ArticleItem> & { id: number }) {
  const collections = [contentState.homeArticles, contentState.myArticles]

  collections.forEach((list) => {
    const index = list.findIndex((item) => item.id === article.id)

    if (index >= 0) {
      list[index] = {
        ...list[index],
        ...article,
      }
    }
  })

  if (contentState.articleDetail?.id === article.id) {
    contentState.articleDetail = {
      ...contentState.articleDetail,
      ...article,
    }
  }
}

export async function loadMeta() {
  contentState.metaLoading = true

  try {
    const [categories, tags] = await Promise.all([
      request<CategoryItem[]>('/categories'),
      request<TagItem[]>('/tags'),
    ])

    contentState.categories = categories
    contentState.tags = tags
    return true
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '加载分类和标签失败', 'error')
    return false
  } finally {
    contentState.metaLoading = false
  }
}

export async function loadHomeArticles(params?: { categoryId?: number; keyword?: string }) {
  contentState.homeLoading = true

  try {
    const searchParams = new URLSearchParams()

    if (params?.categoryId) {
      searchParams.set('categoryId', String(params.categoryId))
    }

    if (params?.keyword) {
      searchParams.set('keyword', params.keyword)
    }

    const payload = await request<ArticleListPayload>(
      `/articles${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
    )

    contentState.homeArticles = payload.list
    return payload
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '加载文章列表失败', 'error')
    return null
  } finally {
    contentState.homeLoading = false
  }
}

export async function loadArticleDetail(articleId: number) {
  contentState.detailLoading = true

  try {
    const article = await request<ArticleItem>(`/articles/${articleId}`)
    contentState.articleDetail = article
    return article
  } catch (error) {
    contentState.articleDetail = null
    setFeedback(error instanceof Error ? error.message : '加载文章详情失败', 'error')
    return null
  } finally {
    contentState.detailLoading = false
  }
}

export async function loadMyArticles() {
  if (!authState.token) {
    contentState.myArticles = []
    return []
  }

  contentState.myArticlesLoading = true

  try {
    const articles = await request<ArticleItem[]>('/articles/mine', { method: 'GET' }, authState.token)
    contentState.myArticles = articles
    return articles
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '加载我的文章失败', 'error')
    return []
  } finally {
    contentState.myArticlesLoading = false
  }
}

export async function loadEditableArticle(articleId: number) {
  if (!authState.token) {
    setFeedback('请先登录后再编辑文章', 'error')
    return null
  }

  contentState.editorLoading = true

  try {
    return await request<ArticleItem>(`/articles/${articleId}/edit`, { method: 'GET' }, authState.token)
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '加载文章失败', 'error')
    return null
  } finally {
    contentState.editorLoading = false
  }
}

export async function saveArticle(input: {
  articleId?: number
  title: string
  summary: string
  content: string
  categoryId?: number | null
  tagIds: number[]
  status: number
}) {
  if (!authState.token) {
    setFeedback('请先登录后再发布文章', 'error')
    return null
  }

  contentState.saving = true

  try {
    const article = await request<ArticleItem>(
      input.articleId ? `/articles/${input.articleId}` : '/articles',
      {
        method: input.articleId ? 'PATCH' : 'POST',
        body: JSON.stringify({
          title: input.title,
          summary: input.summary,
          content: input.content,
          categoryId: input.categoryId,
          tagIds: input.tagIds,
          status: input.status,
        }),
      },
      authState.token,
    )

    patchArticleInCollections(article)
    setFeedback(input.articleId ? '文章更新成功' : '文章创建成功', 'success')
    return article
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '保存文章失败', 'error')
    return null
  } finally {
    contentState.saving = false
  }
}

export async function toggleLike(articleId: number) {
  if (!authState.token) {
    setFeedback('登录后才能点赞文章', 'error')
    return null
  }

  try {
    const result = await request<{ liked: boolean; likeCount: number }>(
      `/articles/${articleId}/like`,
      { method: 'POST' },
      authState.token,
    )

    patchArticleInCollections({
      id: articleId,
      liked: result.liked,
      likeCount: result.likeCount,
    })

    return result
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '点赞失败', 'error')
    return null
  }
}

export async function toggleFavorite(articleId: number) {
  if (!authState.token) {
    setFeedback('登录后才能收藏文章', 'error')
    return null
  }

  try {
    const result = await request<{ favorited: boolean; favoriteCount: number }>(
      `/articles/${articleId}/favorite`,
      { method: 'POST' },
      authState.token,
    )

    patchArticleInCollections({
      id: articleId,
      favorited: result.favorited,
      favoriteCount: result.favoriteCount,
    })

    return result
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '收藏失败', 'error')
    return null
  }
}
