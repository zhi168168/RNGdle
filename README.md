# Static Game Site SEO Template

这个文件夹是一个可复制的游戏站模板。以后做新游戏站时，可以复制整个 `D:\website\example` 文件夹，改成新的项目名，然后主要专注三件事：

- 实现游戏本体
- 写游戏相关介绍和 FAQ 内容
- 修改站点品牌、域名、隐私和条款

## Quick Start

```bash
cd D:\website\example
npm run build
npm run dev
```

本地预览：

```text
http://localhost:5173
```

静态产物会生成到：

```text
dist
```

部署到 Vercel 时使用：

```text
buildCommand: npm run build
outputDirectory: dist
```

## 新项目复制流程

1. 复制文件夹：

```text
D:\website\example
```

例如复制成：

```text
D:\website\my-new-game
```

2. 修改 `package.json`

把 `name` 改成项目名，例如：

```json
"name": "my-new-game"
```

3. 修改 `site.config.json`

至少要改：

- `site.name`
- `site.shortName`
- `site.domain`
- `site.description`
- `site.datePublished`
- `site.dateModified`
- `site.contactEmail`
- `site.reportEmail`
- `site.gaId`，没有就留空
- `game.localStorageKey`，每个站必须唯一
- `game.question`，首页游戏上方的一句话介绍

4. 修改首页 SEO 内容

编辑：

```text
content/home.json
```

这里控制：

- 首页 title
- 首页 description
- 隐藏 H1
- WebApplication 结构化数据描述
- 首页下方 FAQ 手风琴内容

FAQ 每一项的 `title` 会生成 H2，有利于页面结构。`subtitle` 字段目前不显示，只保留给以后扩展。

5. 修改内容页

编辑：

```text
content/pages/about.json
content/pages/privacy.json
content/pages/terms.json
```

默认导航只保留：

- Play
- About Us
- Privacy
- Terms

如果以后某个游戏确实需要更多页面，再在 `content/pages/` 新增 JSON，并同步加到 `site.config.json` 的 `nav`。

6. 替换游戏本体

游戏区域在：

```text
content/game.html
```

游戏逻辑在：

```text
public/app.js
```

游戏样式在：

```text
public/styles.css
```

模板自带的是一个极简示例游戏，只是为了证明结构能跑。正式项目应该替换成真实游戏。

如果游戏需要数据，可以放到：

```text
public/data/game-data.json
```

然后在 `public/app.js` 里 fetch `/data/game-data.json`。

7. 替换图标

编辑或替换：

```text
public/favicon.svg
```

## SEO 基础清单

发布前检查：

- 首页第一个屏幕就是可玩的游戏，不是营销空页
- 每个页面有唯一 `<title>` 和 meta description
- 首页有清楚的隐藏 H1
- 首页 FAQ 有多个 H2
- About Us 讲清楚网站是什么
- Privacy Policy 符合真实数据收集情况
- Terms of Use 符合真实玩法、广告、账号、支付、版权情况
- `sitemap.xml` 和 `robots.txt` 构建正常
- canonical 域名已经从 `https://example.com` 换成正式域名
- `npm run build` 成功
- 本地打开移动端和桌面端都没有文字溢出或按钮重叠

## 目录说明

```text
site.config.json            站点、SEO、导航、游戏配置
content/game.html           首页游戏 HTML 片段
content/home.json           首页 SEO 和 FAQ 内容
content/pages/*.json        About Us、Privacy、Terms
public/app.js               示例游戏逻辑，正式项目替换这里
public/styles.css           全站和游戏样式
public/data/game-data.json  可选游戏数据
public/favicon.svg          图标
scripts/build-static.mjs    静态站构建器
scripts/check-template.mjs  占位词检查脚本
server.mjs                  本地预览服务器
vercel.json                 Vercel 部署配置
dist/                       构建产物，自动生成
```

## 常用命令

```bash
npm run build
npm run dev
npm run check:template
```

`dist/` 是构建产物，不要手动编辑。需要改页面时，改 `site.config.json`、`content/` 或 `public/`，然后重新运行 `npm run build`。
