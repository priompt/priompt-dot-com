/**
 * Central place for all social / external links used across the site.
 * Update these in one spot instead of hunting through components.
 */
export const social = {
  github: "https://github.com/priompt/priompt",
  // Placeholders — fill in when the accounts exist.
  twitter: "",
  discord: "",
  linkedin: "",
  youtube: "",
} as const

export type SocialKey = keyof typeof social
