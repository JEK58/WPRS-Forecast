import Box from "@/components/ui/Box";
import { ForecastView } from "@/components/ForecastView";
import { Suspense } from "react";
import { ForecastSkeleton } from "@/components/ui/skeletons";
import { PageContainer } from "@/components/layout/PageContainer";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const url =
    typeof resolvedSearchParams.url === "string"
      ? resolvedSearchParams.url
      : undefined;

  return (
    <PageContainer spaced={false}>
      <Box>
        <Suspense fallback={<ForecastSkeleton />}>
          <ForecastView url={url} />
        </Suspense>
      </Box>
    </PageContainer>
  );
}
