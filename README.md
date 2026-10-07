# Quiz Game · 前端知识小挑战

> Web 开发技术 · **Lesson 2 课堂项目**
> 使用 VS Code 完成的前端小项目（HTML + CSS + JS），并部署到 Vercel。

## 在线预览

- **Vercel 线上地址**：<https://quiz-game-plum-ten.vercel.app/>
- **GitHub Pages 备用地址**：<待开启后填写>
- **GitHub 仓库地址**：<https://github.com/nijinbo916/quiz-game>

## 玩法

打开就是开始页 → 点「开始挑战」进入答题 → 10 题答完自动结算，可展开错题复盘。

| 特性 | 说明 |
| --- | --- |
| 随机出题 | 每局题目顺序与选项顺序都打乱（Fisher–Yates） |
| 限时作答 | 每题 20 秒，顶部计时条随剩余时间由绿转黄再转红，超时自动判错 |
| 即时反馈 | 选完立刻标出正确项（绿）与你的错选（红），并给出知识点解析 |
| 连对加成 | 连续答对 2 题以上顶部出现 🔥 连对提示 |
| 进度可视 | 顶部进度条 + 「第 N / 10 题」+ 实时得分 |
| 结算页 | 分数环动画、正确率 / 最高连对 / 用时三项统计、分档评语 |
| 错题复盘 | 逐题列出你的选择与正确答案，错题左侧红条标记 |
| 最高分 | 用 `localStorage` 记录历史最高分，显示在右上角 |
| 键盘操作 | <kbd>1</kbd>–<kbd>4</kbd> 或 <kbd>A</kbd>–<kbd>D</kbd> 选答案，<kbd>Enter</kbd> / <kbd>空格</kbd> 下一题，结算页 <kbd>Enter</kbd> 直接再来一局 |

## 目录结构

```
quiz-game/
├── index.html        页面结构：开始页 / 答题页 / 结算页 三个 section
├── css/
│   └── style.css     样式层：设计变量、选项四态、进度与计时条、分数环、响应式
├── js/
│   └── main.js       逻辑层：题库、洗牌、计时器、计分、结算、复盘、键盘
├── README.md
└── .gitignore
```

## 本地运行

无需构建、无需依赖，直接双击 `index.html` 即可。

若想用本地服务器预览（推荐）：

```bash
# 方式一：VS Code 装 Live Server 插件，右键 index.html → Open with Live Server
# 方式二：命令行起一个静态服务
python -m http.server 5173
# 然后访问 http://localhost:5173
```

## 实现要点

**HTML** —— 三个 `<section>` 表示三个屏幕，用 `hidden` 属性切换，不做页面跳转；
选项用 `<ul><li><button>`，保证键盘可达；反馈区加 `aria-live="polite"`，读屏软件能播报对错。

**CSS** —— `:root` 设计变量统一色板；选项正确 / 错误 / 变暗 / 悬停四态；
计时条按剩余比例切换绿→黄→红；结算页分数环用 SVG `stroke-dasharray` + `stroke-dashoffset` 做进度动画；
`@media (prefers-reduced-motion: reduce)` 尊重系统减少动效偏好。

**JS** —— 单屏状态机（`start → quiz → result`），核心状态集中在一个 `state` 对象里；
洗牌用 Fisher–Yates，**选项打乱后重新计算 `answer` 下标**，避免答案错位；
计时器 100ms 一 tick、`Math.max(0, …)` 防负数；答题后 `locked = true` 防重复提交；
选项点击用事件委托；`localStorage` 读写包 `try/catch`，防止隐私模式抛错。

## 部署

1. 本地代码经 SSH 推送到 GitHub 仓库
2. Vercel 导入该仓库（Framework Preset 选 **Other**，无需构建命令），自动部署
3. 建议同时在 Settings → Pages 开启 GitHub Pages 作为备用访问入口
