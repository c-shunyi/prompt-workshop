function ensureObject(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(message)
  }
}

function normalizeFilePath(file, trail) {
  if (typeof file !== 'string' || file.trim() === '') {
    throw new Error(`分类节点 ${trail.join(' > ')} 缺少有效的 file 字段`)
  }

  const normalizedFile = file.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '')

  if (normalizedFile.includes('../')) {
    throw new Error(`分类节点 ${trail.join(' > ')} 的 file 不能包含 ../：${file}`)
  }

  if (!normalizedFile.endsWith('.md')) {
    throw new Error(`分类节点 ${trail.join(' > ')} 的 file 必须指向 Markdown 页面：${file}`)
  }

  return normalizedFile
}

export function toDocLink(file) {
  const normalizedFile = normalizeFilePath(file, ['<link>'])
  const withoutExtension = normalizedFile.replace(/\.md$/, '')

  if (withoutExtension === 'index') {
    return '/'
  }

  if (withoutExtension.endsWith('/index')) {
    return `/${withoutExtension.slice(0, -'/index'.length)}/`
  }

  return `/${withoutExtension}`
}

function normalizeNode(node, trail = [], depth = 0) {
  ensureObject(node, `分类节点必须是对象，当前位置：${trail.join(' > ') || 'root'}`)

  const title = typeof node.title === 'string' ? node.title.trim() : ''

  if (!title) {
    throw new Error(`分类节点缺少 title，当前位置：${trail.join(' > ') || 'root'}`)
  }

  const currentTrail = [...trail, title]
  const description =
    typeof node.description === 'string' && node.description.trim() ? node.description.trim() : undefined

  const hasChildren = Array.isArray(node.children)
  const hasFile = typeof node.file === 'string'

  if (hasChildren && hasFile) {
    throw new Error(`分类节点 ${currentTrail.join(' > ')} 不能同时包含 children 和 file`)
  }

  if (!hasChildren && !hasFile) {
    throw new Error(`分类节点 ${currentTrail.join(' > ')} 必须包含 children 或 file`)
  }

  if (hasChildren) {
    if (node.children.length === 0) {
      throw new Error(`分类节点 ${currentTrail.join(' > ')} 的 children 不能为空数组`)
    }

    return {
      type: 'branch',
      title,
      description,
      depth,
      items: node.children.map((item) => normalizeNode(item, currentTrail, depth + 1))
    }
  }

  const file = normalizeFilePath(node.file, currentTrail)

  return {
    type: 'leaf',
    title,
    description,
    depth,
    file,
    link: toDocLink(file)
  }
}

export function normalizeCategoryTree(rawTree) {
  if (!Array.isArray(rawTree)) {
    throw new Error('分类 JSON 顶层必须是数组')
  }

  if (rawTree.length === 0) {
    throw new Error('分类 JSON 顶层数组不能为空')
  }

  return rawTree.map((node) => normalizeNode(node))
}

export function buildCategorySidebarItems(nodes) {
  return nodes.map((node) => {
    if (node.type === 'leaf') {
      return {
        text: node.title,
        link: node.link
      }
    }

    return {
      text: node.title,
      collapsed: node.depth > 0,
      items: buildCategorySidebarItems(node.items)
    }
  })
}

export function collectSidebarPrefixes(nodes) {
  const prefixes = new Set()

  const visit = (items) => {
    for (const node of items) {
      if (node.type === 'leaf') {
        const match = node.link.match(/^\/([^/]+)(?:\/|$)/)

        if (match && match[1] !== 'categories') {
          prefixes.add(`/${match[1]}/`)
        }

        continue
      }

      visit(node.items)
    }
  }

  visit(nodes)

  return [...prefixes].sort()
}

export function countLeafPages(nodes) {
  return nodes.reduce((count, node) => {
    if (node.type === 'leaf') {
      return count + 1
    }

    return count + countLeafPages(node.items)
  }, 0)
}
