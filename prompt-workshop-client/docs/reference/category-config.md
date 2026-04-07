# 分类配置

分类数据来自 `docs/.vitepress/category-tree.json`，它支持无限递归层级。

## 结构约定

- 非叶子节点必须包含 `title` 和 `children`
- 叶子节点必须包含 `title` 和 `file`
- `children` 和 `file` 不能同时存在
- `file` 必须指向 `docs` 目录中的 Markdown 页面文件

## JSON 示例

```json
[
  {
    "title": "顶级分类",
    "children": [
      {
        "title": "次级分类",
        "children": [
          {
            "title": "更深一层分类",
            "children": [
              {
                "title": "页面标题",
                "file": "guide/getting-started.md"
              }
            ]
          }
        ]
      }
    ]
  }
]
```

## 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 当前分类或页面显示名称 |
| `description` | `string` | 可选，分类或页面补充说明 |
| `children` | `array` | 子分类数组，可继续嵌套 |
| `file` | `string` | 叶子节点对应的 Markdown 文件路径 |

## 文件路径规则

- `guide/index.md` 会被解析为 `/guide/`
- `reference/project-structure.md` 会被解析为 `/reference/project-structure`
- `index.md` 会被解析为 `/`

如果 JSON 配置有问题，VitePress 在启动或构建时会直接抛出错误，方便及时定位。
