import Box from "@/components/ui/Box";
import { ForecastView } from "@/components/ForecastView";
import { Suspense } from "react";
import { ForecastSkeleton } from "@/components/ui/skeletons";

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const url =
    typeof searchParams.url === "string" ? searchParams.url : undefined;

  return (
    <>
      <div className="mx-auto flex w-full flex-col space-y-4 p-3 md:max-w-3xl">
        <Box>
          {/* <ForecastSkeleton /> */}
          <Suspense fallback={<ForecastSkeleton />}>
            <ForecastView url={url} />
          </Suspense>
        </Box>
      </div>
    </>
  );
}
