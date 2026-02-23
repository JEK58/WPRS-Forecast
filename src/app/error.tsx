"use client";

import Box from "@/components/ui/Box";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { PageContainer } from "@/components/layout/PageContainer";

export default function Error({
  error,
  // reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <PageContainer>
      <Box>
        <h2 className="text-center text-xl font-semibold">
          Oooops... something went wrong!
        </h2>
      </Box>
    </PageContainer>
  );
}
