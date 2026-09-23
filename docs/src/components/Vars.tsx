import CodeBlock from "@theme/CodeBlock"
import Admonition from "@theme/Admonition"
import Link from "@docusaurus/Link"
import useDocusaurusContext from "@docusaurus/useDocusaurusContext"
import { isPlaceholder, type VarName, vars as fallback } from "../vars"

function useVars(): typeof fallback {
  return useDocusaurusContext().siteConfig.customFields.vars as typeof fallback
}

/** Inline value: <Var name="pypiName" /> */
export function Var({ name }: { name: VarName }) {
  return <code>{useVars()[name]}</code>
}

/**
 * Code block with {{var}} substitution:
 *   <Cmd lang="sh">{`docker run -p 8443:8443 {{dockerImage}}`}</Cmd>
 * Adds a "not final" note when any substituted value is still a placeholder.
 */
export function Cmd({ lang = "sh", title, children }: { lang?: string; title?: string; children: string }) {
  const v = useVars()
  const used = new Set<VarName>()
  const code = children.trim().replace(/\{\{(\w+)\}\}/g, (m, k: string) => {
    if (!(k in v)) return m
    used.add(k as VarName)
    return v[k as VarName]
  })
  const pending = [...used].filter((k) => isPlaceholder(v[k]))
  return (
    <>
      <CodeBlock language={lang} title={title}>
        {code}
      </CodeBlock>
      {pending.length > 0 && (
        <Admonition type="note" title="Name not final">
          {pending.map((k) => v[k]).join(", ")} is a placeholder until the first public release. Build from
          source in the meantime (see <Link to="/installation/from-source">From source</Link>).
        </Admonition>
      )}
    </>
  )
}
