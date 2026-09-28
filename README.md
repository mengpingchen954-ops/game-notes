# 游戏拆解室

一个保存在浏览器本地的个人游戏分析库。每篇分析统一使用四层八问：

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

打开 `http://127.0.0.1:5180/`。按 `N` 新建分析；编辑时按 `Ctrl+S` 保存。

在线版本：<https://mengpingchen954-ops.github.io/game-notes/>

资料保存在当前浏览器的 `localStorage`。请定期使用左侧的“备份”导出 JSON；换浏览器或换电脑时使用“导入”合并。单篇分析还可以导出为 Markdown。

## 验证

```powershell
npm test
npm run build
```

数据备份带版本和字段校验。导入时，同一编号且内容完全相同的条目会跳过；同一编号但内容不同的条目会作为新副本保留，不会静默覆盖。

`main` 分支更新后，GitHub Actions 会运行测试和构建，并自动部署到 GitHub Pages。

## 神仙考核策划

- [《天庭考核：今日宜飞升》详细 GDD](docs/heavenly-exam-gdd.md)
- [抓马 × 玩法最终整合策划](docs/heavenly-exam-master-plan.md)
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
