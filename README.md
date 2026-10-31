# 游戏拆解室

一个保存在浏览器本地的个人游戏灵感库。新建笔记可以先快速记录想法；已有游戏分析仍可使用四层八问继续整理：

1. 核心玩法／核心赌局：选择、信息、收益与损失
2. 操控空间：改变胜算的手段、局面为什么持续变化
3. 重玩变化：下一局为什么仍值得玩
4. 氛围包装：场所与对手、反馈如何赋予选择重量

项目内已经放入《恶魔轮盘》的完整分析示例。

## 使用

```powershell
npm install
npm run dev
```

打开 `http://127.0.0.1:5180/`。按 `N` 新建笔记；编辑时按 `Ctrl+S` 保存。

在线版本：<https://mengpingchen954-ops.github.io/game-notes/>

2026年10月31日已按用户导出的备份发布全部21篇笔记与分析（含新增「手串」），并补齐5个附件原文件。首次访问使用这一快照；已有浏览器继续保留自己的本地笔记。发布的附件可直接下载，也会载入本地附件存储，随完整备份导出。后续本地编辑仍需另行导出并发布，不会自动同步至 GitHub。

资料保存在当前浏览器的 `localStorage`。请定期使用左侧的“备份”导出 JSON；换浏览器或换电脑时使用“导入”合并。单篇分析还可以导出为 Markdown。

列表和详情中的“标重要”按钮可以单独标记重要笔记或分析，不影响已有收藏。排序支持“重要优先”（默认，同组按最近更新）、“最近更新”、“最早更新”和“按名称”，当前浏览器会记住选择，并在全部内容、收藏和草稿中沿用。重要标记随笔记备份导出与导入；旧备份仍可正常读取。

## 验证

```powershell
npm test
npm run build
```

数据备份带版本和字段校验。导入时，同一编号且内容完全相同的条目会跳过；同一编号但内容不同的条目会作为新副本保留，不会静默覆盖。

`main` 分支更新后，GitHub Actions 会运行测试和构建，并自动部署到 GitHub Pages。

## 音乐游戏玩法

左侧“游戏设计模块”新增“音乐游戏玩法”，沿用现有模块导航和表格布局：

- [模块入口](https://mengpingchen954-ops.github.io/game-notes/#lab/music-gameplay)
- [玩法分类总览](https://mengpingchen954-ops.github.io/game-notes/#lab/music-classification)：六大玩法家族、细分操作、代表作品和分类边界。
- [操作与谱面维度](https://mengpingchen954-ops.github.io/game-notes/#lab/music-dimensions)：输入方式、谱面表现、音符动作、判定目标和游戏模式。
- [代表作品对照](https://mengpingchen954-ops.github.io/game-notes/#lab/music-examples)：常见作品的机制组合与同系列多模式。
- [玩法复刻安排](https://mengpingchen954-ops.github.io/game-notes/#lab/music-replication)：独立卡片与页面，整理六步复刻顺序、一比一验收标准和首个太鼓项目范围。

内容为2026年10月13日的对话整理，涵盖经典与受欢迎作品，不是实时市场排名。内容数据位于 `src/musicGameLab.js`。

## 手作饰品游戏

左侧“游戏设计模块”的“手作饰品游戏”，已按游戏导演、设计师、创意导演、视觉艺术家、技术总监和制作人六类技能重整2026年10月16日的创意讨论：

- [模块入口](https://mengpingchen954-ops.github.io/game-notes/#lab/handmade-studio)
- [游戏导演 · 定位与取舍](https://mengpingchen954-ops.github.io/game-notes/#lab/handmade-direction)
- [创意导演 · 品牌与主题](https://mengpingchen954-ops.github.io/game-notes/#lab/handmade-luashaa)
- [游戏导演 · 选题与空位](https://mengpingchen954-ops.github.io/game-notes/#lab/handmade-ideas)
- [游戏设计师 · 核心循环](https://mengpingchen954-ops.github.io/game-notes/#lab/handmade-gameplay)
- [游戏导演 · 竞品与机会](https://mengpingchen954-ops.github.io/game-notes/#lab/handmade-steam)
- [美术与技术 · 3D 目标](https://mengpingchen954-ops.github.io/game-notes/#lab/handmade-visual)
- [制作人 · 原型与验收](https://mengpingchen954-ops.github.io/game-notes/#lab/handmade-prototype)
- [选题筛选 · 优先级](https://mengpingchen954-ops.github.io/game-notes/#lab/handmade-priorities)

内容数据位于 `src/handmadeStudioLab.js`。保留十二类原始题材及19款 Steam 参考，增加低直接竞争机会、可解释委托与重试规则、3D 资产 brief、G0—G4 阶段验收和风险裁剪。已明确的用户偏好、策划建议与待定事项分别标注；品牌资料和 Steam 状态保留来源及日期边界。

2026年10月20日新增独立的“选题筛选 · 优先级”卡片与页面，数据位于 `src/handmadePriorities.js`。整合本轮全部想法为20个方向，按三档立项优先级排序，重点展开药材经营、非遗发饰、兔场、制伞与宠物裁缝。保留用户明确的兔肉、皮毛售卖和学习、采集、加工药材售卖设定；区分用户决定、策划建议与小样本市场检索的证据边界，原有手作专题继续保留。

## 玩法融合与商业选题

左侧“游戏设计模块”在“手作饰品游戏”下方新增独立模块，整理2026年10月25日关于经典玩法、行业题材、剧情与商业验证的讨论：

- [模块入口](https://mengpingchen954-ops.github.io/game-notes/#lab/casual-fusion)
- [路线与验证优先级](https://mengpingchen954-ops.github.io/game-notes/#lab/fusion-selection)：分别判断机制验证、个人完成与商业投入，8个候选按路线比较。
- [组合规律](https://mengpingchen954-ops.github.io/game-notes/#lab/fusion-patterns)：玩法、行业、约束、成长与剧情各自承担的作用。
- [50个组合方向](https://mengpingchen954-ops.github.io/game-notes/#lab/fusion-ideas)：保留广泛构思及各方向的主要验证问题。
- [规则与订单剧情](https://mengpingchen954-ops.github.io/game-notes/#lab/fusion-stories)：旧珠新约的可执行规则、示例关卡、花艺备选与人物回访。
- [轻策略设计](https://mengpingchen954-ops.github.io/game-notes/#lab/fusion-strategy)：判断时机、调配资源与扩大地盘。
- [核心玩法验证](https://mengpingchen954-ops.github.io/game-notes/#lab/fusion-validation)：原型范围、试玩观察与商业验证的区别。

内容数据位于 `src/casualFusionLab.js`。2026年10月26日修订，保留六篇与50个方向，取消统一名次；以个人先完成小作品为前提，先验证旧珠新约，花艺为备选，买断与轻策略单独比较。增加取珠胜负、撤销与示例规则，补清花材去向、工坊交期和连续关卡产能检查。以上是待试玩的策划建议，不是市场榜单、收益预测或最终立项决定。

## 逆袭成长与末日重建

2026年10月28日新增独立模块，沿用现有导航、主题卡片、目录和表格。内容数据位于 `src/comebackSurvivalLab.js`，与“玩法融合与商业选题”互相链接：

- [模块入口](https://mengpingchen954-ops.github.io/game-notes/#lab/comeback-survival)
- [类型与方向](https://mengpingchen954-ops.github.io/game-notes/#lab/comeback-overview)
- [古代穿越 · 贫穷翻身](https://mengpingchen954-ops.github.io/game-notes/#lab/comeback-ancient)
- [丧尸重生 · 晶核堡垒](https://mengpingchen954-ops.github.io/game-notes/#lab/comeback-wasteland)
- [竞品与参考边界](https://mengpingchen954-ops.github.io/game-notes/#lab/comeback-references)
- [竞争力与原型验证](https://mengpingchen954-ops.github.io/game-notes/#lab/comeback-validation)

保留两条用户原始设定，区分类型命名、核心循环、十二款讨论参考、差异化假设和原型范围。首饰、三消与具体原型数量仍是建议；尚未最终立项或独立核对参考游戏的最新版本，不作市场排名或收益预测。本轮只更新资料模块，不修改浏览器笔记存储。

## 神仙考核策划

- [《天庭考核：今日宜飞升》详细 GDD](docs/heavenly-exam-gdd.md)
- [《天庭考核：今日宜飞升》最终整合主策划](docs/heavenly-exam-master-plan.md)
- [经典益智玩法借鉴与落地规则](docs/heavenly-exam-classic-reference-design.md)
- [玩法机制设计](docs/heavenly-exam-mechanics.md)
- [抓马升级策划](docs/heavenly-exam-drama-upgrade.md)
- [世界观转向建议](docs/heavenly-exam-direction.md)
- [网络梗与喜剧包装策划](docs/no-fighting-humor-design.md)
- [原百艺擂台大会方案](docs/no-fighting-tournament-gdd.md)

## 天下第一，禁止动武

- 完整比赛原型：`/game-notes/play/no-fighting/match.html`
- 原教学关：`/game-notes/play/no-fighting/`
- 双旗进阶关：`/game-notes/play/no-fighting/?level=advanced`

完整比赛是一场三回合的独立网页原型：放旗引掌门出圈，选择一句话术，再以两张证据回应他的争议。三种话术分别对应「依法定胜」「借势服人」「以礼成局」。证据不足时可直接补证；结算后可跳过引势回合，尝试另一种说法。

胜印只保存在当前浏览器的 `no-fighting-match-seals-v1` 本地记录中，不影响笔记备份。尚不包含多对手赛季或账号同步。判定逻辑位于 `src/no-fighting/match-model.js`，测试覆盖九种话术与证据组合、缺证提示与重复结算。
