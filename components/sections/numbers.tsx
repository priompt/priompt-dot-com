import { cn } from "@/lib/utils";

interface NumbersProps {
  className?: string;
}

const Numbers = ({ className }: NumbersProps) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <h1 className="text-center text-4xl font-semibold lg:text-6xl">
          Zero lost writes. Zero incidents.
        </h1>
        <div className="grid gap-10 pt-9 md:grid-cols-3 lg:gap-0 lg:pt-20">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Sustained under load
            </p>
            <p className="pt-4 text-7xl font-semibold lg:pt-10">1.42M</p>
            <p className="text-2xl font-semibold text-muted-foreground">
              actions
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Running concurrently
            </p>
            <p className="pt-4 text-7xl font-semibold lg:pt-10">40</p>
            <p className="text-2xl font-semibold text-muted-foreground">
              workers
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Continuous soak test
            </p>
            <p className="pt-4 text-7xl font-semibold lg:pt-10">90</p>
            <p className="text-2xl font-semibold text-muted-foreground">
              minutes
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Numbers };
