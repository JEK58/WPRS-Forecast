"use client";

import Box from "@/components/ui/Box";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

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
    <div className="mx-auto flex w-full flex-col space-y-4 p-3 md:max-w-3xl">
      <Box>
        <h2 className="text-center">Oooops... something went wrong!</h2>
      </Box>
    </div>
  );
}
