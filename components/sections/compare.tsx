import {
  BadgePercent,
  CheckCircle,
  CircleMinus,
  Code2,
  Headset,
  LineChart,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CompareProps {
  className?: string;
}

const Compare = ({ className }: CompareProps) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <div className="flex flex-col items-center gap-4">
          <Badge variant="outline">Comparison</Badge>
          <h2 className="mx-auto max-w-2xl text-center text-4xl font-semibold sm:text-5xl">
            Prompts deserve what code already has
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
            Hard-coding prompts in your app is like emailing final_v2.js around.
            Here's Priompt next to prompts-in-code.
          </p>
        </div>
        <div className="-mx-7 overflow-x-auto">
          <div className="mt-14 grid min-w-2xl grid-cols-3">
            <div className="border-b border-border p-5"></div>
            <div className="flex flex-col items-center gap-2 rounded-t-2xl border-b border-border bg-muted p-5">
              <Image
                src="/images/black-priompt-icon.png"
                alt="Priompt logo"
                width={473}
                height={450}
                className="size-8 dark:invert"
              />
              <p className="text-lg font-semibold">Priompt</p>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                A version-controlled home for your prompts
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 border-b border-border p-5">
              <Code2 className="size-8" />
              <p className="text-lg font-semibold">Prompts in code</p>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                Hard-coded strings scattered across repos
              </p>
            </div>
            <div className="flex items-center gap-2 border-b border-border p-5">
              <Users className="size-4 shrink-0" />
              <span className="font-semibold">Version history</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 border-b border-border bg-muted p-5">
              <CheckCircle className="size-5 text-green-600" />
              <span className="text-xs text-muted-foreground">
                Commits, branches, merges
              </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 border-b border-border p-5">
              <CircleMinus className="size-5 text-red-600" />
              <span className="text-xs text-muted-foreground">
                Whatever git blame catches
              </span>
            </div>
            <div className="flex items-center gap-2 border-b border-border p-5">
              <BadgePercent className="size-4 shrink-0" />
              <span className="font-semibold">Semantic diff</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 border-b border-border bg-muted p-5">
              <CheckCircle className="size-5 text-green-600" />
              <span className="text-xs text-muted-foreground">
                Meaning-aware verdict
              </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 border-b border-border p-5">
              <CircleMinus className="size-5 text-red-600" />
              <span className="text-xs text-muted-foreground">
                Plain text diff only
              </span>
            </div>
            <div className="flex items-center gap-2 border-b border-border p-5">
              <Code2 className="size-4 shrink-0" />
              <span className="font-semibold">Instant rollback</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 border-b border-border bg-muted p-5">
              <CheckCircle className="size-5 text-green-600" />
              <span className="text-xs text-muted-foreground">
                Move a pointer, done
              </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 border-b border-border p-5">
              <CircleMinus className="size-5 text-red-600" />
              <span className="text-xs text-muted-foreground">
                Revert, rebuild, redeploy
              </span>
            </div>
            <div className="flex items-center gap-2 border-b border-border p-5">
              <LineChart className="size-4 shrink-0" />
              <span className="font-semibold">Live change push</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 border-b border-border bg-muted p-5">
              <CheckCircle className="size-5 text-green-600" />
              <span className="text-xs text-muted-foreground">
                Agents notified instantly
              </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 border-b border-border p-5">
              <CircleMinus className="size-5 text-red-600" />
              <span className="text-xs text-muted-foreground">
                Wait for the next deploy
              </span>
            </div>
            <div className="flex items-center gap-2 border-border p-5">
              <Headset className="size-4 shrink-0" />
              <span className="font-semibold">Self-hosted &amp; private</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 border-border bg-muted p-5">
              <CheckCircle className="size-5 text-green-600" />
              <span className="text-xs text-muted-foreground">
                Runs on your own box
              </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 p-5">
              <CheckCircle className="size-5 text-green-600" />
              <span className="text-xs text-muted-foreground">
                Also in your repo
              </span>
            </div>
            <div className="border-border p-5"></div>
            <div className="flex items-center justify-center gap-2 rounded-b-2xl border-border bg-muted p-5">
              <Button className="w-full" asChild>
                <a
                  href="https://github.com/priompt/priompt"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get started with Priompt
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Compare };
