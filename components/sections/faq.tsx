import { ArrowRight, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FaqLineItem {
  question: string;
  answer: string;
  tag: string;
}

interface FaqProps {
  badge: string;
  heading: string;
  description: string;
  items: FaqLineItem[];
  supportText: string;
  supportLinkLabel: string;
  supportUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  className?: string;
}

type Props = Partial<FaqProps>;

export const defaultItems: FaqLineItem[] = [
  {
    question: "What is Priompt?",
    answer: "A self-hosted server that versions and serves prompts to agents.",
    tag: "General",
  },
  {
    question: "Is it really self-hosted?",
    answer: "Yes. One Go binary on your box; prompts never leave your infra.",
    tag: "Hosting",
  },
  {
    question: "How do agents fetch a prompt?",
    answer: "By address over gRPC, e.g. priompt://acme/onboarding/welcome.",
    tag: "Usage",
  },
  {
    question: "What's a semantic diff?",
    answer: "It measures how far an edit's meaning ripples, not just the text.",
    tag: "Diff",
  },
  {
    question: "Which languages are supported?",
    answer: "Python and JavaScript SDKs today; any gRPC client works too.",
    tag: "SDKs",
  },
  {
    question: "SQLite or Postgres?",
    answer: "Both. SQLite for single-node, Postgres for multi-node setups.",
    tag: "Storage",
  },
  {
    question: "Can I roll back a bad change?",
    answer: "Instantly. Rollback just moves a branch pointer, nothing is lost.",
    tag: "Versioning",
  },
  {
    question: "Is it open source?",
    answer: "Yes, and pre-release. Star the repo to follow along.",
    tag: "License",
  },
];

const defaultProps: FaqProps = {
  badge: "FAQ",
  heading: "Questions, answered",
  description: "The short version. The README has the long one.",
  items: defaultItems,
  supportText: "Something else? Open an issue on",
  supportLinkLabel: "GitHub",
  supportUrl: "https://github.com/priompt/priompt/issues",
  ctaLabel: "Read the docs",
  ctaUrl: "https://github.com/priompt/priompt#readme",
};

const Faq = (props: Props) => {
  const {
    badge,
    heading,
    description,
    items,
    supportText,
    supportLinkLabel,
    supportUrl,
    ctaLabel,
    ctaUrl,
    className,
  } = {
    ...defaultProps,
    ...props,
  };

  return (
    <section className={cn("py-32", className)}>
      <div className="container mx-auto">
        <div className="mx-auto flex max-w-5xl flex-col gap-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
              {badge}
            </span>
            <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              {heading}
            </h2>
            <p className="max-w-md text-sm text-balance text-muted-foreground sm:text-base">
              {description}
            </p>
          </div>

          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {items.map((item, index) => (
              <li
                key={item.question}
                className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1 py-4 sm:grid-cols-[auto_minmax(0,1.2fr)_minmax(0,1fr)_auto] sm:items-baseline sm:gap-6"
              >
                <span className="font-mono text-[10px] font-medium tracking-widest text-muted-foreground uppercase tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-sm font-medium text-foreground sm:text-base">
                  {item.question}
                </p>
                <span className="col-start-3 row-start-1 self-center rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium tracking-widest text-muted-foreground uppercase sm:col-start-4 sm:self-baseline">
                  {item.tag}
                </span>
                <p className="col-span-3 text-sm text-muted-foreground sm:col-span-1 sm:col-start-3 sm:row-start-1">
                  {item.answer}
                </p>
              </li>
            ))}
          </ul>

          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-xs text-muted-foreground">
              <Mail className="mr-1.5 inline size-3" />
              {supportText}{" "}
              <a
                href={supportUrl}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {supportLinkLabel}
              </a>
            </p>
            <Button size="sm" variant="outline" asChild>
              <a href={ctaUrl}>
                {ctaLabel}
                <ArrowRight />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Faq };
