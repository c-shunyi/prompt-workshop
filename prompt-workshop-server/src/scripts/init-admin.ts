import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { execute, pool, queryOne } from '../db/client';
import { AdminRole } from '../types';

async function main() {
  const username = process.env.INIT_ADMIN_USERNAME || 'admin';
  const password = process.env.INIT_ADMIN_PASSWORD || '123456';
  const nickname = process.env.INIT_ADMIN_NICKNAME || '系统管理员';

  const existingAdmin = await queryOne<{ id: number }>(
    'SELECT id FROM admin_users WHERE username = ? LIMIT 1',
    [username],
  );

  if (existingAdmin) {
    console.log(`管理员 ${username} 已存在，无需重复初始化。`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await execute(
    `INSERT INTO admin_users
      (username, password_hash, nickname, role, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
    [username, passwordHash, nickname, AdminRole.SUPER_ADMIN],
  );

  console.log('管理员初始化完成。');
  console.log(`用户名: ${username}`);
  console.log(`密码: ${password}`);
}

main()
  .catch((error) => {
    console.error('管理员初始化失败:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
