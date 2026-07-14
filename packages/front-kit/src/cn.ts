/** 极简 class 合并（O2 接入 shadcn 时替换为 clsx + tailwind-merge）。 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
