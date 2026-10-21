"use client";

/** 夹具的控制台页面：只为证明控制台页面不会出现在公开路由的客户端引用里（e2e「public routes reference no console pages」）。 */
export default function FixtureConsolePage() {
  return <p data-fixture-console>fixture console</p>;
}
