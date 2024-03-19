export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-xl bg-zinc-100 p-6 text-gray-400 shadow-md dark:bg-cyan-950">
      {children}
    </div>
  );
}
