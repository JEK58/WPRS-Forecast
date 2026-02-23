import Box from "@/components/ui/Box";
import RecentQueriesTable from "@/components/RecentQueriesTable";
import { CompUrlInput } from "@/components/CompUrlInput";
import { PageContainer } from "@/components/layout/PageContainer";

export default function HomePage() {
  return (
    <PageContainer>
      <CompUrlInput />
      <Box>
        <RecentQueriesTable />
      </Box>
    </PageContainer>
  );
}
