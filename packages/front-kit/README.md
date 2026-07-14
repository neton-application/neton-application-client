# front-kit — UI 组件唯一属地

spec 冻结（NETON_APPLICATION_FRONT_SPEC §3.1）：

- 所有 shadcn/ui 操作只发生在本包（`shadcn init --base base` / `shadcn add`），
  初始原语 Base UI；原语是实现细节，禁止泄漏到业务模块。
- 业务模块只允许 `import { ... } from "@neton/application-front-kit"`。
- 当前为 P0 骨架：手写最小组件集（纯 Tailwind，无原语依赖）。
  shadcn/Base UI 正式接入 + DataTable/Form 复合件规格 = spec O2 子任务。
