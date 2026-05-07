import { cn } from "@/utils/utils";

export function PageContainer({
  children,
  className,
  spaced = true,
}: {
  children: React.ReactNode;
  className?: string;
  spaced?: boolean;
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-3xl px-0 py-2 sm:px-3 sm:py-3",
        spaced && "space-y-4",
        className,
      )}
    >
      {children}
    </main>
  );
}
