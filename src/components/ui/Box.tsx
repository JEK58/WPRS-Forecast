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
        "card rounded-lg border border-white/70 bg-white/92 shadow-lg shadow-slate-900/10 backdrop-blur-sm",
        "dark:border-cyan-800/60 dark:bg-cyan-950/90 dark:text-slate-100 dark:shadow-black/20",
        className,
      )}
    >
      <div className="card-body p-5 sm:p-6">{children}</div>
    </section>
  );
}
