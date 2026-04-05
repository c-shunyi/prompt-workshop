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

export function renderMarkdown(content: string) {
  const raw = content || ''

  if (isRichTextHtml(raw)) {
    return DOMPurify.sanitize(raw)
  }

  return DOMPurify.sanitize(markdown.render(raw))
}
