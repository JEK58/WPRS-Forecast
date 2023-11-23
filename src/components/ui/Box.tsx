export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-xl bg-zinc-200 p-6 shadow-md dark:bg-cyan-950">
      {children}
    </div>
  );
}
