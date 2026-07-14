import { defineFrontModule } from "@neton/application-front-contract";

/** page key == 后端 system_menus.component（base V002 seed：/system 下 user 等）。 */
export default defineFrontModule({
  id: "system",
  contractVersion: "1.0.0",
  pages: [
    { key: "system/user/index", path: "/system/user", entry: "user-list", rendering: "client" },
  ],
});
