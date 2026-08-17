# JLPT Study Garden · 完整学习系统阶段记录

更新日期：2026-08-17

## 产品闭环

```text
Learn → Practice → Record → Diagnose → Review → Practice again
```

核心功能采用 local-first：匿名用户可以学习、练习、续做、查看进度与完成复习；登录只增加跨设备同步。AI 是可选增强，不是主流程依赖。

## Phase 1 · StudyStore abstraction — 已完成

统一 `StudyStore` 已覆盖学习事件、复习状态、练习场次、学习目标、设备 ID、同步游标与本地数据清除。词汇、课程、听力、练习和复习中心共用同一学习记录模型。

## Phase 2 · Anonymous IndexedDB — 已完成

匿名用户可以完成课程、专项练习、30/38/57 题诊断、断点续做、规则学习计划、Dashboard 和 Review Center。没有账号、API Key 或云端连接时，完整学习闭环仍可运行。

## Phase 3 · Study Event schema — 已完成

事件覆盖课程开始/完成、概念/词汇/听力复习、练习与诊断作答。只有明确完成、回忆、判断或作答才产生事件；普通浏览不会改变掌握度。

## Phase 4 · D1 identity migration — 已完成

内部 `users`、`auth_identities`、`study_events` 与 `ai_credentials` 已建立。ChatGPT 身份通过 adapter 关联内部 UUID；旧 profile、session、attempt 和 plan 会幂等回填为统一学习事件。三份迁移已通过 SQLite foreign-key 验证。

## Phase 5 · Local ↔ Cloud sync — 已完成

同步使用 `clientEventId` 幂等键，依次 push 未同步事件、pull 游标之后的云端事件、去重合并，并从全部评分事件重建复习状态。退出登录不会清除本机记录。

## Phase 6 · Dashboard — 已完成

Dashboard 对匿名用户开放，包含 Today、7/30 天趋势、三领域时间、完成记录、待复习、Coverage 与 Mastery。Coverage 与掌握度分开显示，避免把“看过”误认为“会了”。

## Phase 7 · Learning-first courses — 已完成

- 语言知识問題1–9：40 个语义单元、120 道微训练、例句平假名、中文释义、易错对比、综合练习与扩展阅读。
- 阅读問題10–14：五套独立读法，包含判断流程、模型、代表场景、陷阱、考场检查与掌握记录。
- 听力問題1–5：26 个语义单元；問題1/2/3/5拥有独立 Hub、短课、练习、场景模型与扩展阅读，問題4保留三秒即时应答训练。
- 普通学习页只显示学习目标、例句、练习和下一步；来源与文件关系仅保留在专用资料索引。

## Phase 8 · Diagnostic — 已完成

诊断题库共 57 题，覆盖语言 9、阅读 5、听力 5，共 19 个题型。Quick 30、Standard 38、Deep 57 和自定义模式均使用确定性分层抽样；报告包含 readiness、confidence、领域得分、题型覆盖、强弱能力和下一步学习路线。样本不足会自动降低可信度。

## Phase 9 · AI provider security — 已完成

AI provider adapter 支持站点模型、OpenAI BYOK 和自定义 Responses-compatible endpoint。安全边界包括：HTTPS、无重定向、请求/响应大小限制、15 秒超时、DNS 与 IPv4/IPv6 内网拦截、严格 JSON schema、匿名 Use Once，以及登录后的 AES-256-GCM Secure Save。浏览器只接收末四位等掩码信息，保存后的明文密钥不会返回。

## Phase 10 · Review Center — 已完成

`/n2/review` 汇总词汇、听力卡片、能力单元和当前错题。到期项目可在中心内直接揭晓并选择“不会 / 模糊 / 会了”；错题会链接到精确知识单元，完成后可立即进入第二轮练习。

## 分级词汇 N1–N5 — 已完成

- 11,568 个可学习词条，N1–N5 共用等级切换、假名分类、搜索、双向遮挡回忆和本地掌握记录。
- 16,139 个日中对照例句；例句用结构化 ruby segments 和原生 `<ruby><rt>` 显示平假名。
- N1、N3、N4、N5 已补齐所有缺失例句；N2 先补充 80 个高频缺口，同时保留无可靠例句词条，避免用低质量套句冒充自然语料。

## 隐私与数据 — 已完成

`/privacy` 说明本地记录、云端同步、AI 密钥和诊断用途，并提供清除当前设备记录与删除云端学习数据的入口。云端删除同时覆盖事件、练习、计划和安全保存的 AI 配置，但不删除用户的 ChatGPT 账号。

## 最终验收

- `npm run lint`、生产构建与 14 组系统测试全部通过。
- 30 题快速诊断实测为 30 题，前 19 题覆盖全部 19 个题型，顺序按语言/阅读/听力交错。
- 实际点击完成 N2 地图 → 语言問題4 → 搭配短课、听力問題3、练习台、复习中心、N5 词汇例句、阅读問題10和隐私页。
- 1440×900、1024×768、390×844 三种宽度均无横向溢出；手机菜单可展开并完成导航。
- 浏览器运行日志无 error 或 warning；学习页未出现仓库路径或内部整理说明。
