import type { NextConfig } from "next";
import frontModules from "./front.modules";

const config: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  transpilePackages: [
    "@neton/application-front-contract",
    "@neton/application-front-runtime",
    "@neton/application-front-kit",
    ...frontModules,
  ],
};

export default config;
