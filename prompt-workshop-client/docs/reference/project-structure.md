# 项目结构

当前目录结构如下：

```text
prompt-workshop-client/
├─ docs/
│  ├─ .vitepress/
│  │  ├─ category-tree.json
│  │  ├─ config.mts
│  │  ├─ utils/
│  │  │  └─ category.mjs
│  │  └─ theme/
│  │     ├─ custom.css
│  │     └─ index.ts
│  ├─ categories/
│  │  └─ index.md
│  ├─ games/
│  │  └─ snake.md
│  ├─ guide/
│  │  ├─ getting-started.md
│  │  └─ index.md
│  ├─ public/
│  │  └─ logo.svg
│  ├─ reference/
│  │  ├─ category-config.md
│  │  └─ project-structure.md
│  └─ index.md
├─ .gitignore
└─ package.json
```

## 目录说明

- `docs/.vitepress/category-tree.json`：分类数据源，支持递归层级与页面文件映射
- `docs/.vitepress/config.mts`：VitePress 站点配置，包含标题、导航、侧边栏和搜索
- `docs/.vitepress/utils/category.mjs`：分类 JSON 的校验、路径转换与侧边栏生成逻辑
- `docs/.vitepress/theme/`：主题扩展入口与自定义样式
- `docs/categories/`：分类简介页面，提示用户从左侧分类菜单进入对应内容
- `docs/games/`：小游戏相关的提示词页面
- `docs/public/`：静态资源目录，构建时会原样复制
- `docs/guide/`：面向使用者的文档内容
- `docs/reference/`：面向维护者的结构与约定说明

## 常见维护动作

- 新增页面：直接在 `docs` 下创建 Markdown 文件
- 加入导航：修改 `docs/.vitepress/config.mts`
- 调整视觉：修改 `docs/.vitepress/theme/custom.css`
