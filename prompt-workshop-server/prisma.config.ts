import path from 'node:path';
import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 配置文件
 * 数据库连接 URL 通过环境变量 DATABASE_URL 提供
 */
export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'src', 'prisma', 'schema.prisma'),
  migrate: {
    async url() {
      return process.env.DATABASE_URL!;
    },
  },
});
