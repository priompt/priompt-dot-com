/**
 * Release names that are not final yet. Every page reads them through <Var>
 * and <Cmd>, so picking a real name is a one-line change here (or an env var
 * at build time: PRIOMPT_DOCKER_IMAGE=ghcr.io/priompt/priompt pnpm build).
 *
 * A value wrapped in <angle brackets> counts as unpublished: <Cmd> shows a
 * "name not final" note under any command that uses one.
 */
export const vars = {
  dockerImage: process.env.PRIOMPT_DOCKER_IMAGE ?? "<docker-image>",
  pypiName: process.env.PRIOMPT_PYPI_NAME ?? "<pypi-package>",
  npmName: process.env.PRIOMPT_NPM_NAME ?? "<npm-package>",
  version: process.env.PRIOMPT_VERSION ?? "0.7.0",
  githubOrg: "https://github.com/priompt",
}

export type VarName = keyof typeof vars

export const isPlaceholder = (v: string) => v.startsWith("<") && v.endsWith(">")
