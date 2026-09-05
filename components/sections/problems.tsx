import {
  Clock,
  FileDiff,
  GitCompare,
  Lock,
  RefreshCwOff,
  ShieldOff,
  Undo2,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProblemItem {
  icon: LucideIcon;
  tag: string;
  title: string;
  description: string;
}

const problems: ProblemItem[] = [
  {
    icon: Clock,
    tag: "History",
    title: "No version history",
    description: "You edited the prompt in place. The old wording is gone for good.",
  },
  {
    icon: Undo2,
    tag: "Recovery",
    title: "No rollback",
    description: "A bad change is live and there is no clean way back to what worked.",
  },
  {
    icon: FileDiff,
    tag: "Diffs",
    title: "Blind diffs",
    description: "A text diff shows the words changed, not whether the meaning did.",
  },
  {
    icon: RefreshCwOff,
    tag: "Delivery",
    title: "Stale agents",
    description: "A prompt updates, but agents keep running the old copy until a redeploy.",
  },
  {
    icon: Lock,
    tag: "Ownership",
    title: "Vendor lock-in",
    description: "Your prompts live in someone else's cloud, behind an API key you rent.",
  },
  {
    icon: ShieldOff,
    tag: "Governance",
    title: "No review gate",
    description: "Anyone can ship a prompt change straight to production, unchecked.",
  },
];

interface ProblemsProps {
  className?: string;
}

const Problems = ({ className }: ProblemsProps) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="mx-auto flex flex-col gap-4 md:col-span-2">
            <Badge
              variant="outline"
              className="flex w-fit gap-1 px-2.5 py-1.5 text-sm"
            >
              <GitCompare className="h-auto w-4" />
              The problem
            </Badge>
            <h2 className="text-3xl font-semibold lg:text-4xl">
              You changed a prompt, broke an agent, and lost the old one
            </h2>
            <p className="text-muted-foreground">
              Prompts run your agents in production, yet most live in scattered
              files, chat threads, and hard-coded strings, with no history, no
              review, and no way to roll back when a change goes wrong.
            </p>
          </div>
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="flex flex-col gap-4 rounded-xl border p-6 transition-colors duration-300 hover:bg-muted/60"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-12 shrink-0 place-content-center rounded-md border bg-muted/40 text-foreground">
                  <problem.icon className="size-6" />
                </span>
                <span className="rounded-full border px-3 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {problem.tag}
                </span>
              </div>
              <div>
                <h3 className="font-medium md:text-lg">{problem.title}</h3>
                <p className="text-sm text-muted-foreground md:text-base">
                  {problem.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { Problems };
