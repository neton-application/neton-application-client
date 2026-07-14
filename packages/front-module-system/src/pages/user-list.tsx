"use client";

import * as React from "react";
import { apiFetch } from "@neton/application-front-runtime/client";
import type { PageResponse } from "@neton/application-front-runtime/types";
import {
  Alert, Button, Card, CardContent, CardHeader, CardTitle,
  Table, TBody, TD, TH, THead, TR,
} from "@neton/application-front-kit";

interface UserRow {
  id: number;
  username: string;
  nickname: string;
  email?: string | null;
  mobile?: string | null;
  status: number;
  createdAt?: string | null;
}

export default function SystemUserListPage() {
  const [rows, setRows] = React.useState<UserRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [pageNo, setPageNo] = React.useState(1);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const pageSize = 20;

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    apiFetch<PageResponse<UserRow>>(`/admin/system/user/page?pageNo=${pageNo}&pageSize=${pageSize}`)
      .then((res) => {
        if (!alive) return;
        setRows(res.list);
        setTotal(res.total);
        setError(null);
      })
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [pageNo]);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>用户管理</CardTitle>
        <span className="text-sm text-zinc-500">共 {total} 条</span>
      </CardHeader>
      <CardContent>
        {error && <Alert tone="error">{error}</Alert>}
        {loading && <p className="py-8 text-center text-sm text-zinc-400">加载中…</p>}
        {!loading && !error && (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>ID</TH><TH>用户名</TH><TH>昵称</TH><TH>手机号</TH><TH>状态</TH><TH>创建时间</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((u) => (
                  <TR key={u.id}>
                    <TD>{u.id}</TD>
                    <TD>{u.username}</TD>
                    <TD>{u.nickname}</TD>
                    <TD>{u.mobile ?? "-"}</TD>
                    <TD>{u.status === 1 ? "启用" : "停用"}</TD>
                    <TD>{u.createdAt ?? "-"}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" disabled={pageNo <= 1} onClick={() => setPageNo(pageNo - 1)}>
                上一页
              </Button>
              <span className="text-sm text-zinc-500">第 {pageNo} 页</span>
              <Button
                variant="outline" size="sm"
                disabled={pageNo * pageSize >= total}
                onClick={() => setPageNo(pageNo + 1)}
              >
                下一页
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
