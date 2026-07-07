import type { Config } from "@react-router/dev/config";

const isGhPages = process.env.GITHUB_ACTIONS === "true";

export default {
  ssr: false,
  prerender: true,
  basename: isGhPages ? "/proxy-tools" : "/",
} satisfies Config;
