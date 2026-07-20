# front-kit — UI 组件唯一属地

spec 冻结（NETON_APPLICATION_FRONT_SPEC §3.1）：

- 所有 shadcn/ui 操作只发生在本包；当前组件按官方 `new-york-v4`
  registry 组织，并使用其 `radix-ui` 原语。原语是实现细节，禁止泄漏到业务模块。
- 业务模块只允许 `import { ... } from "@neton/application-front-kit"`。
- 默认主题使用 shadcn 官方 neutral tokens；产品品牌色不能覆盖基础控件 token。

## 圆角规范

圆角统一由 shell 的 `--radius: 0.625rem` 派生，业务模块不得使用任意像素圆角。

| 等级 | 当前值 | 使用范围 |
|---|---:|---|
| `rounded-xs` | 4px | Checkbox 等微型控件 |
| `rounded-sm` | 6px | 菜单项、紧凑内部元素 |
| `rounded-md` | 8px | Button、Input、Select、工具栏图标按钮 |
| `rounded-lg` | 10px | 导航项、页签、方形头像和图标容器 |
| `rounded-xl` | 14px | Card、筛选面板、数据表外框、Dialog |
| `rounded-full` | 50% | 状态徽章、圆形头像，禁止用于普通容器 |

业务页面禁止 `rounded-2xl`、`rounded-3xl` 和 `rounded-[Npx]`。需要新增层级时先在
`front-kit` 评审，不允许模块自行扩展。
