import DefaultTheme from 'vitepress/theme'
import CategoryTree from './components/CategoryTree.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('CategoryTree', CategoryTree)
  }
}
