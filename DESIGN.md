# 游戏拆解室

A personal Chinese game analysis library, not a promotional landing page. Four layers and eight questions remain the primary information architecture. General template says 核心玩法; gambling template says 核心赌局.

## Visual specification

- Dark charcoal left rail (#22232c), cool white reading surface (#ffffff), pale gray canvas (#f6f7fa), violet accent (#7763d8).
- 228px desktop navigation; open document layout with 48px outer padding and a compact right contents rail. No large promotional hero, fictitious metrics or fabricated analyses.
- Typography: system sans with Microsoft YaHei/PingFang SC fallback. Title 36px, section 21px, body 14px with 1.85 line height. Small English game title and monospaced section numbers add hierarchy.
- Distinctive components: four linked formula segments, numbered document sections, question/answer rows, subtle tinted takeaway note. Outline icons from Lucide.
- Main screen: breadcrumb and actions, game title and metadata, one-sentence thesis, four-layer formula, detail/note/takeaway tabs, core loop, eight questions, sources. Navigation links to collection, favorites, drafts and reusable template.
- Collection screen: searchable, filterable list; a single real seed analysis and an explicit new-analysis action. Do not invent research records to fill empty space.
- Editor: metadata followed by eight structured questions and freeform notes. Explicit save, unsaved-change guard, Ctrl/Cmd+S. Native dialog for delete/discard confirmation.
- Mobile: compact header, collapsible navigation, no right rail, vertically stacked formula and question rows.

## Functional contract

Create, edit, delete, favorite, search full text, filter category/status, JSON import/export with validation, Markdown export, browser local persistence, clear save failure feedback. Import never silently overwrites differing records with the same ID.

## Design tooling limitation

Image Gen is unavailable in this session. This written specification is the implementation reference. No generated concept or claimed image-to-image fidelity; verify actual desktop/mobile screenshots against this specification. No image assets are necessary for this text-focused workspace.
