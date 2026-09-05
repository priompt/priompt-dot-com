import { ArrowRight } from "lucide-react";
import { FaGithub } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CtaProps {
  className?: string;
}

const Cta = ({ className }: CtaProps) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Primary dark card — fixed dark surface so it reads as an accent
              panel in light mode and does not merge into the page in dark. */}
          <div className="relative h-[350px] overflow-hidden rounded-xl border border-white/10 bg-neutral-950 text-white md:col-span-2">
            <div className="flex h-full flex-row p-4 sm:p-8 md:p-12">
              <div className="relative z-10 w-full self-center px-2 text-center sm:w-auto sm:flex-1 sm:px-0 md:text-left">
                <h2 className="mb-4 text-3xl font-bold sm:mb-6 sm:text-2xl md:text-3xl">
                  Give your prompts a home you control.
                </h2>
                <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4 md:justify-start">
                  <Button asChild>
                    <a
                      href="https://github.com/priompt/priompt"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaGithub />
                      <span>Star on GitHub</span>
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="border border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    asChild
                  >
                    <a
                      href="https://github.com/priompt/priompt#readme"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>Read the docs</span>
                    </a>
                  </Button>
                </div>
              </div>
              {/* Oversized Priompt icon in its own column, anchored to the
                  bottom so it is cropped by the card's overflow-hidden. It sits
                  beside the text (flex sibling) so it never overlaps it. */}
              <div className="relative z-0 hidden w-[220px] shrink-0 self-end md:block">
                <img
                  src="/images/white-priompt-icon.png"
                  alt="Priompt"
                  className="pointer-events-none absolute right-0 bottom-[-48px] h-[300px] w-auto max-w-none opacity-90"
                />
              </div>
            </div>
          </div>

          {/* Secondary card — "works with anything" statement (no subscribe
              form, since there is no backend for it yet). */}
          <div className="hidden h-[350px] flex-col justify-between rounded-xl bg-muted p-6 sm:flex sm:p-8 md:p-12">
            <div>
              <h3 className="mb-2 text-xl font-semibold sm:text-2xl">
                If it can read text, it works.
              </h3>
              <p className="text-sm text-muted-foreground">
                Priompt just stores and serves your prompts as versioned text.
                Any agent, any framework, any language that speaks gRPC can
                fetch them by address.
              </p>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <a
                href="https://github.com/priompt/priompt#readme"
                target="_blank"
                rel="noopener noreferrer"
              >
                See how it works
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Cta };
