import type { SidebarsConfig } from "@docusaurus/plugin-content-docs"

const sidebars: SidebarsConfig = {
  docs: [
    "intro",
    "quickstart",
    {
      type: "category",
      label: "Installation",
      link: { type: "doc", id: "installation/index" },
      items: [
        "installation/docker",
        "installation/linux",
        "installation/macos",
        "installation/windows",
        "installation/from-source",
      ],
    },
    {
      type: "category",
      label: "Concepts",
      items: ["concepts/prompts", "concepts/versioning", "concepts/live-updates", "concepts/semantic-diff"],
    },
    {
      type: "category",
      label: "Guides",
      items: ["guides/use-cases", "guides/promptctl", "guides/sso", "guides/web-ui"],
    },
    {
      type: "category",
      label: "Client SDKs",
      items: ["sdks/python", "sdks/javascript", "sdks/other-languages"],
    },
    {
      type: "category",
      label: "Operations",
      items: [
        "operations/configuration",
        "operations/security",
        "operations/storage",
        "operations/caching",
        "operations/monitoring",
        "operations/scaling",
      ],
    },
    {
      type: "category",
      label: "Reference",
      items: ["reference/cli", "reference/promptctl", "reference/priompt-auth", "reference/grpc-api"],
    },
    {
      type: "category",
      label: "Contributing",
      items: ["contributing/development", "contributing/proto", "contributing/db-adapters", "contributing/testing"],
    },
    "roadmap",
  ],
}

export default sidebars
