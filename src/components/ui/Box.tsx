export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-zinc-50 p-6 shadow-md dark:bg-cyan-950">
      {children}
    </div>
  );
}
