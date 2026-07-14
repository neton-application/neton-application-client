import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: [
    "@neton/application-front-contract",
    "@neton/application-front-runtime",
    "@neton/application-front-kit",
    "@neton/application-front-module-system",
  ],
};

export default config;
