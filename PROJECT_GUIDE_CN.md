# JLPT N2 Study Atlas：项目说明

这是当前 JLPT N2 学习网站的可开发源码快照。它把你的 N2 Markdown、Typst、PDF 提取内容、词库和听力笔记重组成可阅读、可搜索、可练习的网站。

## 使用的技术

- **Next.js 16 + React 19 + TypeScript**：页面、路由和交互组件。
- **Vinext + Vite**：本地开发和面向 Cloudflare Worker 的构建。
- **CSS**：全部视觉与响应式布局写在 `app/globals.css`；没有依赖现成 UI 模板。
- **JSON / TypeScript 数据文件**：保存整理后的题型内容、词表、来源索引与完整笔记。
- **OpenAI Sites / Cloudflare**：当前线上站点的托管与部署环境。

## 最重要的目录

```text
app/
  page.tsx                    首页
  n2/                         N2 学习地图、语言知识、阅读、听力、词库、资料索引、备考记录
  components/                 词库遮挡、听力训练、整合笔记、备考记录等组件
  data/                       整理后的学习内容和 JSON 数据
  globals.css                 全站视觉、桌面与手机布局
scripts/
  extract-*.mjs               从原始资料生成网页数据时使用的脚本
```

## 在自己电脑上查看

需要 Node.js 22.13 或以上。解压后，在这个目录运行：

```bash
npm install
npm run dev
```

终端会显示本地网址；在浏览器打开即可。

## 需要知道的事

- 压缩包**不包含** `node_modules`、构建输出和运行缓存；它们可以通过 `npm install` 重新生成。
- `app/data/` 里是已网页化的数据，不是原始 PDF 的副本。
- 完整真题与听力原文不应直接作为公开网页正文发布；网站只保留来源索引和整理后的学习方法。
- 当前线上部署配置在 `.openai/hosting.json`；其中没有包含可直接复用的登录密码或私密令牌。
