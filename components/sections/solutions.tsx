import { cn } from "@/lib/utils";

interface DashedLineProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

const DashedLine = ({
  orientation = "horizontal",
  className,
}: DashedLineProps) => {
  const isHorizontal = orientation === "horizontal";

  return (
    <div
      className={cn(
        "relative text-muted-foreground",
        isHorizontal ? "h-px w-full" : "h-full w-px",
        className,
      )}
    >
      <div
        className={cn(
          isHorizontal
            ? [
                "h-px w-full",
                "bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,currentColor_4px,currentColor_10px)]",
                "[mask-image:linear-gradient(90deg,transparent,black_25%,black_75%,transparent)]",
              ]
            : [
                "h-full w-px",
                "bg-[repeating-linear-gradient(180deg,transparent,transparent_4px,currentColor_4px,currentColor_10px)]",
                "[mask-image:linear-gradient(180deg,transparent,black_25%,black_75%,transparent)]",
              ],
        )}
      />
    </div>
  );
};

interface FeatureImage {
  src: string;
  alt: string;
  url?: string;
  /** For mono logos that need inverting in dark mode (no color variant). */
  invert?: boolean;
}

interface FeatureItem {
  title: string;
  description: string;
  images: FeatureImage[];
  isIconGrid?: boolean;
}

interface SolutionsProps {
  heading?: string;
  topItems?: FeatureItem[];
  bottomItems?: FeatureItem[];
  className?: string;
}

const Solutions = ({
  heading = "Everything you already trust in Git, now for your prompts",
  topItems = [
    {
      title: "Versioned by address.",
      description:
        "Every prompt has a URI, commits, and branches. Roll back to any version instantly.",
      images: [
        {
          src: "/images/solutions/vision.png",
          alt: "Prompt version history: a commit graph with a branch, merge, and rollback arrow",
        },
      ],
    },
    {
      title: "Works with any agent.",
      description:
        "Fetch prompts by address from LangChain, CrewAI, LlamaIndex, or any gRPC client.",
      images: [
        {
          src: "/images/logos/langchain-color.svg",
          alt: "LangChain logo",
          url: "https://www.langchain.com",
        },
        {
          src: "/images/logos/crewai-color.svg",
          alt: "CrewAI logo",
          url: "https://www.crewai.com",
        },
        {
          src: "/images/logos/llamaindex-color.svg",
          alt: "LlamaIndex logo",
          url: "https://www.llamaindex.ai",
        },
        {
          src: "/images/logos/pydanticai-color.svg",
          alt: "PydanticAI logo",
          url: "https://ai.pydantic.dev",
        },
        {
          src: "/images/logos/hermesagent.svg",
          alt: "Hermes Agent logo",
          url: "https://nousresearch.com",
          invert: true,
        },
        {
          src: "/images/logos/openclaw-color.svg",
          alt: "OpenClaw logo",
          url: "https://github.com/openclaw",
        },
      ],
      isIconGrid: true,
    },
  ],
  bottomItems = [
    {
      title: "Semantic diff.",
      description:
        "See whether an edit's meaning ripples out or stays contained, not just which words changed.",
      images: [
        {
          src: "/images/solutions/semantic.png",
          alt: "A changed line in a prompt with ripples showing how far its meaning spreads",
        },
      ],
    },
    {
      title: "Live distribution.",
      description:
        "Publish a change and every subscribed agent is notified the instant it lands.",
      images: [
        {
          src: "/images/solutions/live_distribution.png",
          alt: "A central server pushing a change out to many subscribed agents",
        },
      ],
    },
    {
      title: "Yours to host.",
      description:
        "One Go binary, SQLite or Postgres, encrypted at rest. No API key, ever.",
      images: [
        {
          src: "/images/solutions/self_host.png",
          alt: "A server inside a shield with a padlock, representing self-hosted and private",
        },
      ],
    },
  ],
  className,
}: SolutionsProps) => {
  return (
    <section className={cn("overflow-hidden pb-28 lg:pb-32", className)}>
      <div>
        <h2 className="container text-center text-3xl tracking-tight text-balance sm:text-4xl md:text-5xl lg:text-6xl">
          {heading}
        </h2>

        <div className="mt-8 md:mt-12 lg:mt-20">
          <DashedLine
            orientation="horizontal"
            className="container scale-x-105"
          />

          {/* Top Features Grid - 2 items */}
          <div className="relative container flex max-md:flex-col">
            {topItems.map((item, i) => (
              <FeatureCard
                key={i}
                item={item}
                isLast={i === topItems.length - 1}
              />
            ))}
          </div>
          <DashedLine
            orientation="horizontal"
            className="container max-w-7xl scale-x-110"
          />

          {/* Bottom Features Grid - 3 items */}
          <div className="relative container grid max-w-7xl md:grid-cols-3">
            {bottomItems.map((item, i) => (
              <FeatureCard
                key={i}
                item={item}
                isLast={i === bottomItems.length - 1}
                className="md:pb-0"
              />
            ))}
          </div>
        </div>
        <DashedLine
          orientation="horizontal"
          className="container max-w-7xl scale-x-110"
        />
      </div>
    </section>
  );
};

interface FeatureCardProps {
  item: FeatureItem;
  isLast?: boolean;
  className?: string;
}

const FeatureCard = ({ item, isLast, className }: FeatureCardProps) => {
  return (
    <div
      className={cn(
        "relative flex flex-1 flex-col justify-between px-0 py-6 md:px-6 md:py-8",
        className,
      )}
    >
      <div className="mb-5 text-balance md:mb-8">
        <h3 className="inline font-semibold">{item.title} </h3>
        <span className="text-muted-foreground">{item.description}</span>
      </div>

      {item.isIconGrid ? (
        <div className="relative overflow-hidden">
          <div className="flex flex-wrap gap-4">
            {item.images.map((image, j) => {
              const tile = (
                <div className="grid aspect-square size-14 place-items-center rounded-xl bg-background p-2 transition-transform hover:scale-105 lg:size-16">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className={cn(
                      "size-8 object-contain lg:size-10",
                      image.invert && "dark:invert",
                    )}
                  />
                </div>
              );

              return image.url ? (
                <a
                  key={j}
                  href={image.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={image.alt}
                  className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {tile}
                </a>
              ) : (
                <div key={j}>{tile}</div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {item.images.map((image, j) => (
            <div
              key={j}
              className="mb-6 flex aspect-square w-full max-w-[16rem] items-center justify-center overflow-hidden rounded-xl border border-border bg-[#f6f6f4]"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="max-h-full max-w-full object-contain object-center"
              />
            </div>
          ))}
        </div>
      )}

      {!isLast && (
        <>
          <DashedLine
            orientation="vertical"
            className="absolute top-0 right-0 max-md:hidden"
          />
          <DashedLine
            orientation="horizontal"
            className="absolute inset-x-0 bottom-0 md:hidden"
          />
        </>
      )}
    </div>
  );
};

export { Solutions };
