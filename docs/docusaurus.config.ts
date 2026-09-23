import { themes as prismThemes } from "prism-react-renderer"
import type { Config } from "@docusaurus/types"
import type * as Preset from "@docusaurus/preset-classic"
import { vars } from "./src/vars"

const config: Config = {
  title: "Priompt Docs",
  tagline: "Git, but for your AI prompts",
  favicon: "img/favicon.ico",
  url: process.env.DOCS_URL ?? "https://docs.priompt.com",
  baseUrl: "/",
  onBrokenLinks: "throw",
  markdown: { format: "detect", mermaid: true, hooks: { onBrokenMarkdownLinks: "throw" } },
  themes: ["@docusaurus/theme-mermaid"],
  customFields: { vars },

  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/", // docs-only site: no landing page, no blog
          sidebarPath: "./sidebars.ts",
        },
        blog: false,
        theme: { customCss: "./src/css/custom.css" },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: { respectPrefersColorScheme: true },
    navbar: {
      title: "Priompt",
      logo: { alt: "Priompt", src: "img/android-chrome-192x192.png" },
      items: [
        { type: "docSidebar", sidebarId: "docs", position: "left", label: "Docs" },
        { to: "/reference/cli", label: "Reference", position: "left" },
        { href: "https://priompt.com", label: "priompt.com", position: "right" },
        { href: vars.githubOrg, label: "GitHub", position: "right" },
      ],
    },
    footer: {
      style: "dark",
      copyright: `Priompt v${vars.version} · pre-release`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "powershell", "protobuf", "toml", "ini"],
    },
  } satisfies Preset.ThemeConfig,
}

export default config
