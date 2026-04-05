import * as adminUserService from './admin-user.service';
import * as contentService from './content.service';
import * as userService from './user.service';

interface AdminOverview {
  adminTotal: number;
  userTotal: number;
  categoryTotal: number;
  tagTotal: number;
  articleTotal: number;
  publishedArticleTotal: number;
}

interface AdminEditorUserOption {
  id: number;
  username: string;
  email: string;
  nickname: string | null;
  avatar: string | null;
  bio: string | null;
  status: number;
  lastLoginAt: Date | null;
  createdAt: Date;
}

interface AdminEditorOptions {
  users: AdminEditorUserOption[];
  categories: contentService.CategoryItem[];
  tags: contentService.TagItem[];
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const [adminTotal, userTotal, categoryTotal, tagTotal, articleStats] = await Promise.all([
    adminUserService.getAdminCount(),
    userService.getUserCount(),
    contentService.getCategoryCount(),
    contentService.getTagCount(),
    contentService.getAdminArticleStats(),
  ]);

  return {
    adminTotal,
    userTotal,
    categoryTotal,
    tagTotal,
    articleTotal: articleStats.total,
    publishedArticleTotal: articleStats.published,
  };
}

export async function getEditorOptions(): Promise<AdminEditorOptions> {
  const [users, categories, tags] = await Promise.all([
    userService.listEnabledUsers(),
    contentService.listAdminCategoryOptions(),
    contentService.listAdminTagOptions(),
  ]);

  return {
    users,
    categories,
    tags,
  };
}
