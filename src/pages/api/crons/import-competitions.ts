import type { NextApiRequest, NextApiResponse } from "next";
import * as Sentry from "@sentry/nextjs";

import { env } from "@/env.js";
import {
  type RecentCompetitionImportSummary,
  importRecentCivlCompetitions,
} from "@/server/db/civl-competition-import";

type ImportCompetitionsFn = () => Promise<RecentCompetitionImportSummary>;

export function createImportCompetitionsHandler(
  importCompetitions: ImportCompetitionsFn,
  expectedApiKey: string,
) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    const apiKeyQuery = req.query.apiKey;
    const apiKey = Array.isArray(apiKeyQuery) ? apiKeyQuery[0] : apiKeyQuery;

    if (typeof apiKey !== "string" || apiKey.trim() !== expectedApiKey) {
      console.info("Attempted competition import with invalid API key");
      return res.status(401).json({ message: "Invalid API key" });
    }

    try {
      console.info("Importing recent CIVL competition details...");
      const result = await importCompetitions();
      console.info("...done");

      return res.status(200).json(result);
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
      return res.status(500).json({ message: "Internal error" });
    }
  };
}

const handler = createImportCompetitionsHandler(
  importRecentCivlCompetitions,
  env.API_KEY,
);

export default handler;
