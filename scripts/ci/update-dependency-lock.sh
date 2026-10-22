#!/usr/bin/env bash
# 用本机兄弟仓库当前检出的提交号生成 dependencies.lock（模板 dependencies.lock.template 列出仓库与路径）。
#
# 锁的是本地 HEAD：CI 必须构建与本地验证过的完全相同的依赖。HEAD 还没推送到远端时给出警告——推送之前 CI 检出不到它。
# 用法：在本仓库里执行 scripts/ci/update-dependency-lock.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
workspace="$(cd "$here/../../../.." && pwd)"   # projects/ （与 Neton/、itwind/ 同级）
out="$here/dependencies.lock"
tmp="$(mktemp)"
echo "# 由 scripts/ci/update-dependency-lock.sh 生成，勿手改。格式：<仓库> <路径> <提交号>" > "$tmp"
while read -r repo path; do
  [[ -z "${repo:-}" || "$repo" == \#* ]] && continue
  dir="$workspace/$path"
  [ -d "$dir/.git" ] || { echo "missing checkout: $dir" >&2; exit 1; }
  sha="$(git -C "$dir" rev-parse HEAD)"
  if ! git -C "$dir" remote get-url origin >/dev/null 2>&1; then
    echo "warning: $path has no remote yet; push it to github.com/$repo before CI can check out ${sha:0:12}" >&2
  elif [ -z "$(git -C "$dir" branch -r --contains "$sha" 2>/dev/null)" ]; then
    echo "warning: $path ${sha:0:12} is not on any remote branch; push it before CI can check it out" >&2
  fi
  printf '%-52s %-52s %s\n' "$repo" "$path" "$sha" >> "$tmp"
done < "$here/dependencies.lock.template"
mv "$tmp" "$out"
echo "wrote $out"
