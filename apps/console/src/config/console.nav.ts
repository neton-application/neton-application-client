import type { NavItem } from "@neton/application-client-runtime/menu";

/**
 * C 端控制台静态导航（产品 fork 覆盖此文件；与后端菜单/RBAC 无关）。
 *
 * 用户侧不做权限门控 —— layout 给 AppShell 传的是 `roles={[]} permissions={[]}`，每一项对每个
 * 登录用户都可见。用户能看什么由后端接口按 identity 隔离，侧栏藏页面不构成安全边界。
 *
 * 每一项对应 console 装配的一个页面；侧栏名同时是该页的页签标题（见 workspace-root.tsx）。
 * icon 取 app-shell.tsx 里 iconMap 的键名，写错会静默回落到 CircleDot。
 */
export const consoleNav: NavItem[] = [];

/**
 * 二级页面：有入口、但不进侧栏 —— 从别的页面或右上角个人菜单点进去（例如 client-account 的
 * 修改密码、绑定邮箱、绑定手机）。产品 fork 在这里写明每页从哪进，好让「装配了的页面都有入口」
 * 这件事可以被检查：既不在 consoleNav 也不在这里的页面，就只剩手敲 URL 一条路。
 */
export const consoleSubPages: Array<{ path: string; from: string }> = [];
