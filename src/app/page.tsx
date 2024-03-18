import Box from "@/components/ui/Box";
import RecentQueriesTable from "@/components/RecentQueriesTable";
import { CompUrlInput } from "@/components/CompUrlInput";

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full flex-col space-y-4 p-3 md:max-w-3xl">
      <CompUrlInput />
      {/* Recent queries */}
      <Box>
        <RecentQueriesTable />
      </Box>
    </div>
  );
}
