// Registers <Var>, <Cmd>, <Tabs> and <TabItem> in every .mdx page without an import.
import MDXComponents from "@theme-original/MDXComponents"
import Tabs from "@theme/Tabs"
import TabItem from "@theme/TabItem"
import { Cmd, Var } from "@site/src/components/Vars"

export default { ...MDXComponents, Var, Cmd, Tabs, TabItem }
