import type { Config } from "@react-router/dev/config";

export default {
  ssr: false,
  prerender: true,
  basename: process.env.GITHUB_ACTIONS === "true" ? "/proxy-tools" : "/",
} satisfies Config;
