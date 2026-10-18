import type { SidebarsConfig } from "@docusaurus/plugin-content-docs"

// One sidebar per navbar tab. Nesting stays at tab > category > page.
const sidebars: SidebarsConfig = {
  start: [
    "intro",
    "quickstart",
    {
      type: "category",
      label: "Install",
      link: { type: "doc", id: "installation/index" },
      items: [
        "installation/docker",
        "installation/linux",
        "installation/macos",
        "installation/windows",
        "installation/from-source",
      ],
    },
    "use-cases",
    "roadmap",
  ],
  guides: [
    {
      type: "category",
      label: "Concepts",
      link: { type: "generated-index" },
      items: [
        "concepts/architecture",
        "concepts/prompts",
        "concepts/versioning",
        "concepts/live-updates",
        "concepts/semantic-diff",
        "concepts/access-control",
      ],
    },
    {
      type: "category",
      label: "Author prompts",
      items: ["guides/promptctl", "guides/ci", "guides/embedding-model"],
    },
    {
      type: "category",
      label: "Serve prompts to agents",
      items: ["guides/branch-pin-rollback", "guides/hot-reload", "guides/ab-test"],
    },
    {
      type: "category",
      label: "Web UI",
      link: { type: "doc", id: "guides/web-ui/index" },
      items: [
        "guides/web-ui/run",
        "guides/web-ui/browse",
        "guides/web-ui/edit-and-publish",
        "guides/web-ui/review-commit",
        "guides/web-ui/branches",
      ],
    },
    { type: "category", label: "Access", items: ["guides/sso"] },
    "guides/troubleshooting",
  ],
  sdks: ["sdks/index", "sdks/python", "sdks/javascript", "sdks/other-languages"],
  operate: [
    "operations/production-checklist",
    "operations/security",
    "operations/storage",
    "operations/caching",
    "operations/monitoring",
    "operations/scaling",
  ],
  reference: [
    { type: "category", label: "CLI", items: ["reference/cli", "reference/promptctl", "reference/priompt-auth"] },
    "reference/configuration",
    "reference/grpc-api",
    "reference/errors",
    "reference/glossary",
    "reference/changelog",
    "reference/known-issues",
  ],
  contribute: [
    "contributing/development",
    "contributing/proto",
    "contributing/db-adapters",
    "contributing/testing",
    "contributing/docs",
  ],
}

export default sidebars
