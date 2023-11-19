export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-xl bg-gray-100 p-6 shadow-md">
      {children}
    </div>
  );
}
