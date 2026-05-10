# tokenfolio

> 把你的 AI 编码足迹做成一张可分享的简历页。填一份数据，部署一个网页，让 HR 看到「和机器协作」具体长什么样。

[![npm](https://img.shields.io/npm/v/tokenfolio?style=for-the-badge&color=cb3837&logo=npm)](https://www.npmjs.com/package/tokenfolio)
[![Use this template](https://img.shields.io/badge/use_this-template-2ea44f?style=for-the-badge&logo=github)](https://github.com/tt-a1i/tokenfolio/generate)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tt-a1i/tokenfolio)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/tt-a1i/tokenfolio)

> **语言：** **中文** · [English](./README.en.md)

挑一个模板 → 改一份 `data.js` → 一键部署。三步搞定。

**在线 Demo：** https://tt-a1i.github.io/tokenfolio/

## 模板（9 个，更多持续加）

| | 名字 | 风格 |
|---|---|---|
| 🟢 | **wrapped**   | Spotify Wrapped 风：大色块月卡 + 高亮 peak 月，最适合发朋友圈 |
| 🌌 | **cosmos**    | 暗夜星座时间轴：每月一个星座，每个会话一颗星，独一无二 |
| 📰 | **almanac**   | 「Token 年鉴」：哥特刊头 + 月度叙事 + 项目分类广告，文学性最强 |
| 💻 | **terminal**  | 黑底绿字 hacker 风：boot 序列动画 + ASCII 条形图 + Unicode 边框 |
| 🌈 | **aurora**    | 极光渐变 + 毛玻璃卡片：Apple Vision / Linear 风，最适合给 HR 看 |
| ✨ | **holo**      | 全息收藏卡：鼠标跟随 3D 倾斜 + 彩虹反光，传播力最强 |
| 🎮 | **pixel**     | 8-bit RPG 角色卡：HP/MP 条 + 星级属性 + 任务日志，「按 A 招募我」 |
| ✈️ | **pass**      | 80 年代航空登机牌：穿孔 + 条形码 + 月度护照盖章，复古收藏感 |
| 🟨 | **brutalist** | 瑞士 + Wired 风：黄黑红三色块、Helvetica Black 200px、不对称 grid |

欢迎 PR 新模板。

## 快速开始

1. 点上面的 **Use this template** 按钮 → 派生一份 history 干净的新仓库（提交还会计入你的 contribution graph）
2. clone 到本地
3. 用下面的 CLI 自动生成 `data.js`，或者手动编辑
4. 点上方任一 Deploy 按钮，或开 GitHub Pages（Settings → Pages → `main` 分支 / 根目录）

### CLI · `tokenfolio init`

```bash
# 第一次推荐：先 dry-run 预览，不落盘
npx tokenfolio init --dry

# 默认行为：同时聚合 Claude + Codex 数据
npx tokenfolio init --force

# 单源 / 指定年份
npx tokenfolio init --source codex  --year 2026 --dry
npx tokenfolio init --source claude --year 2025 --dry

# 覆盖身份（默认读 git config）
npx tokenfolio init \
  --name "Ada Lovelace" --handle "@ada" --location "London"
```

CLI 内部用 [`ccusage`](https://github.com/ryoppippi/ccusage) 解析 Claude Code，用自带的 JSONL 解析器处理 Codex。

**当前支持的数据源：**

| 来源 | 位置 | 机制 |
|---|---|---|
| Claude Code | `~/.claude/projects/` | `ccusage`（首次运行通过 npx 自动拉取） |
| Codex       | `~/.codex/sessions/`  | 内置解析器 |

**接下来要加：** Cursor / Aider / Continue.dev（如果它们暴露了 token 计数）

**隐私红线：** 只读取 token 数 / 模型名 / 项目路径 / 时间戳。**绝不读取 prompt 内容** —— Codex 的 `response_item` 行和 Claude JSONL 的 `message` 行都被显式跳过。

### 个性化 OG 图 · `tokenfolio og`

跑完 `init` 后，再跑一次 `og`，生成一张包含你真实数字的 1200×630 og.png。链接发到 X / LinkedIn / 飞书时，预览卡显示的是你的成绩单，而不是默认占位图：

```bash
npx tokenfolio og
# → 写入 ./og.png（1200×630，可直接作为 og:image）
```

需要 Python 3.9+ 和 Pillow（`pip install Pillow`）。OG 这一步和 `init` 解耦——不需要 OG 图的人零额外依赖。

### 本地预览

```bash
git clone https://github.com/<你>/<你的-repo>.git
cd <你的-repo>
python3 -m http.server 8765
open http://localhost:8765
```

### 用某个模板作为首页

默认根 `index.html` 是 9 个模板的画廊。选定一个之后，**最简单**的方法是在根目录 `index.html` 用一行重定向：

```html
<meta http-equiv="refresh" content="0; url=templates/wrapped/">
```

> ⚠️ **不要直接把模板文件复制到根目录** — 模板里的 `<script src="../../data.js">` 是相对路径，复制到根后会变成 404。如果非要复制，记得把所有 `../../data.js` 改成 `./data.js`。

### 不用 Claude / Codex？手填 `data.js`

如果你的 AI 工具不在 CLI 支持列表里，可以手动填 `data.js`，结构见下面。token 数据从哪儿找：

- **Cursor**：Settings → Usage（按月看 prompt / completion tokens）
- **GitHub Copilot**：[github.com/settings/billing](https://github.com/settings/billing) → Plans and usage（季度账单可见 token 用量）
- **Aider**：每次会话结束 Aider 会打印 `Tokens: X sent, Y received`，自己加和
- **Continue.dev**：暂无聚合视图，用 VS Code 扩展的 logs 翻

填完后跑 `tokenfolio og`（或不跑）→ 部署。CLI 接入 PR 欢迎。

## 数据结构

`data.js` 单文件，定义全局 `window.RESUME_DATA`：

```js
window.RESUME_DATA = {
  user:    { name, handle, title, location, since, avatar_initials, bio, links },
  year:    2025,
  totals:  { tokens, input_tokens, output_tokens, sessions, projects, cost_usd, avg_session_tokens },
  by_month:    [{ month, label, tokens, sessions, top_project, top_model, note, peak? }],
  by_model:    [{ name, tokens, sessions, color }],
  top_projects:[{ name, tokens, sessions, language, description }],
  highlights:  [{ label, value, detail }]
};
```

所有模板共读同一份数据。切模板不用动一行内容。

## 路线图

- [x] 9 个模板（wrapped / cosmos / almanac / terminal / aurora / holo / pixel / pass / brutalist）
- [x] `tokenfolio init` CLI · Claude Code（通过 ccusage）
- [x] CLI · Codex（`~/.codex/sessions/`）
- [x] CLI · `tokenfolio og` 个性化 OG 图（Pillow）
- [x] README 中英双语
- [ ] CLI · Cursor / Aider / Continue.dev
- [ ] 更多模板：synthwave / manga / trading-floor
- [ ] 边缘节点动态 OG（Vercel + Satori），让无 Python 环境的用户也能用
- [ ] 模板暗 / 亮模式切换
- [ ] 模板 PNG / PDF 导出
- [ ] CLI 输出文案 i18n

## 贡献

想加一个新模板？在 `templates/<你的名字>/` 下放一个 `index.html`，加载 `../../data.js`，按相同的数据 shape 渲染即可。PR 欢迎。

## License

MIT — 随便用，别拿来告我们就行。
