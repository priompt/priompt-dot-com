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
  onBrokenAnchors: "throw",
  markdown: { format: "detect", mermaid: true, hooks: { onBrokenMarkdownLinks: "throw" } },
  themes: ["@docusaurus/theme-mermaid"],
  plugins: [
    [
      "@docusaurus/plugin-client-redirects",
      {
        // Moved pages redirect to their equivalent, never to the home page.
        redirects: [
          { from: "/guides/use-cases", to: "/use-cases" },
          { from: "/operations/configuration", to: "/reference/configuration" },
        ],
      },
    ],
  ],
  customFields: { vars },

  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/", // docs-only site: no landing page, no blog
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/priompt/priompt-dot-com/edit/main/docs/",
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
        { type: "docSidebar", sidebarId: "start", position: "left", label: "Get started" },
        { type: "docSidebar", sidebarId: "guides", position: "left", label: "Guides" },
        { type: "docSidebar", sidebarId: "sdks", position: "left", label: "SDKs" },
        { type: "docSidebar", sidebarId: "operate", position: "left", label: "Self-host" },
        { type: "docSidebar", sidebarId: "reference", position: "left", label: "Reference" },
        { type: "docSidebar", sidebarId: "contribute", position: "right", label: "Contribute" },
        { href: "https://priompt.com", label: "priompt.com", position: "right" },
        { href: vars.githubOrg, label: "GitHub", position: "right" },
      ],
    },
    footer: {
      style: "dark",
      copyright: `Priompt v${vars.version}`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "powershell", "protobuf", "toml", "ini"],
    },
  } satisfies Preset.ThemeConfig,
}

export default config
