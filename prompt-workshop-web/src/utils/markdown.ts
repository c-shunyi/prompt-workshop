import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  typographer: true,
})

function isRichTextHtml(content: string) {
  const trimmed = content.trim()
  return /^(?:<p\b|<div\b|<h[1-6]\b|<blockquote\b|<ul\b|<ol\b|<table\b|<pre\b)/i.test(trimmed)
}

const openingFencePattern = /^```([\w#+.-]*)?\s*$/
const closingFencePattern = /^```\s*$/

function getNormalizedText(element: Element) {
  return (element.textContent || '').replace(/\u00a0/g, ' ')
}

function getOpeningFenceLanguage(element: Element) {
  const match = getNormalizedText(element).trim().match(openingFencePattern)
  return match ? match[1] || '' : null
}

function isClosingFence(element: Element) {
  return closingFencePattern.test(getNormalizedText(element).trim())
}

function normalizeRichTextCodeFences(content: string) {
  if (typeof DOMParser === 'undefined') {
    return content
  }

  const document = new DOMParser().parseFromString(content, 'text/html')

  function transformContainer(container: Element) {
    Array.from(container.children).forEach((child) => transformContainer(child))

    let elements = Array.from(container.children)
    let index = 0

    while (index < elements.length) {
      const language = getOpeningFenceLanguage(elements[index])

      if (language === null) {
        index += 1
        continue
      }

      let closingIndex = -1

      for (let cursor = index + 1; cursor < elements.length; cursor += 1) {
        if (isClosingFence(elements[cursor])) {
          closingIndex = cursor
          break
        }
      }

      if (closingIndex === -1) {
        index += 1
        continue
      }

      const pre = document.createElement('pre')
      const code = document.createElement('code')

      if (language) {
        code.className = `language-${language}`
      }

      code.textContent = elements
        .slice(index + 1, closingIndex)
        .map((element) => getNormalizedText(element))
        .join('\n')

      pre.appendChild(code)
      container.insertBefore(pre, elements[index])

      for (let removeIndex = index; removeIndex <= closingIndex; removeIndex += 1) {
        const element = elements[removeIndex]

        if (element.parentNode === container) {
          container.removeChild(element)
        }
      }

      elements = Array.from(container.children)
      index += 1
    }
  }

  transformContainer(document.body)
  return document.body.innerHTML
}

export function renderMarkdown(content: string) {
  const raw = content || ''

  if (isRichTextHtml(raw)) {
    const sanitizedHtml = DOMPurify.sanitize(raw)
    return DOMPurify.sanitize(normalizeRichTextCodeFences(sanitizedHtml))
  }

  return DOMPurify.sanitize(markdown.render(raw))
}
