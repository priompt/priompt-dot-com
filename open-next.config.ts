import { defineCloudflareConfig } from "@opennextjs/cloudflare"

// Minimal config. The site is currently fully static, so no incremental cache
// (R2) override is needed yet. If you later add ISR / `revalidate` / on-demand
// revalidation, wire up an incremental cache here (see the Caching docs) and
// add the matching R2 bucket binding in wrangler.jsonc.
export default defineCloudflareConfig({})
