"use client";

import * as Sentry from "@sentry/nextjs";
import type Error from "next/error";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */}
        <NextError statusCode={undefined as any} />{" "}
      </body>
    </html>
  );
}
