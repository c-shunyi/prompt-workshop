# 分类总览

这个页面不是手写分类内容，而是直接根据 `docs/.vitepress/category-tree.json` 递归渲染出来的。

规则很简单：

- 顶层是分类数组
- 中间层使用 `children`
- 最末级使用 `file` 指向 Markdown 页面文件
- 层级可以无限继续嵌套

<CategoryTree />
