# 快速开始

## 安装依赖

```bash
pnpm install
```

## 启动开发环境

```bash
pnpm dev
```

默认会启动一个本地 VitePress 开发服务，适合边写 Markdown 边预览。

## 构建生产版本

```bash
pnpm build
```

构建产物默认输出到 `docs/.vitepress/dist`。

## 本地预览构建结果

```bash
pnpm preview
```

## 下一步建议

1. 把现有的提示词文档迁入 `docs/guide` 或 `docs/reference`
2. 根据实际内容扩展 `docs/.vitepress/config.mts` 中的导航和侧边栏
3. 如果需要品牌化展示，可以继续调整 `docs/.vitepress/theme/custom.css`
