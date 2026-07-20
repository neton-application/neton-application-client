/** 与 module-system AuthController / MenuVO 对齐的最小类型集。 */

export interface Envelope<T> {
  code: number;
  message?: string;
  data?: T;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  expiresTime: number;
  username: string;
  nickname: string;
}

export interface MenuNode {
  id: number;
  name: string;
  permission?: string | null;
  /** 1=目录 2=菜单 3=按钮 */
  type: number;
  parentId: number;
  path?: string | null;
  /** 页面 key（== FrontPageManifest.key） */
  component?: string | null;
  icon?: string | null;
  sort: number;
  status: number;
  visible: boolean;
  keepAlive: boolean;
  children?: MenuNode[] | null;
}

export interface PermissionInfo {
  user: {
    userId: string;
    username: string;
    nickname: string;
    avatar: string;
    homePath: string;
  };
  roles: string[];
  permissions: string[];
  menus: MenuNode[];
}

export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export function formatDateTime(value?: number | string | null): string {
  if (value === null || value === undefined || value === "" || value === 0 || value === "0") return "-";
  const numeric = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  const milliseconds = typeof numeric === "number" && numeric < 10_000_000_000 ? numeric * 1000 : numeric;
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
