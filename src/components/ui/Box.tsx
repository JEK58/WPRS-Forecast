import { cn } from "@/utils/utils";

export default function Box({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "card rounded-lg border border-white/80 bg-white/88 shadow-2xl ring-1 shadow-slate-950/15 ring-white/35 backdrop-blur-md",
        "dark:border-cyan-800/60 dark:bg-cyan-950/88 dark:text-slate-100 dark:shadow-black/25 dark:ring-cyan-300/10",
        className,
      )}
    >
      <div className="card-body p-5 sm:p-6">{children}</div>
    </section>
  );
}
