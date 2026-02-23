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
        "card rounded-xl bg-zinc-50 shadow-md dark:bg-cyan-950",
        "dark:text-slate-200",
        className,
      )}
    >
      <div className="card-body p-5 sm:p-6">{children}</div>
    </section>
  );
}
