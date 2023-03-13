import { prisma } from "@/server/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { getWprs } from "@/utils/calculate-wprs";
import { sanitizeUrl } from "@braintree/sanitize-url";
import rateLimit from "@/utils/rate-limit";
import { env } from "@/env.mjs";

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 40, // Max 40 users per second
});

const SUBMIT_RATE_LIMIT = parseInt(env.SUBMIT_RATE_LIMIT, 10);

interface ExtendedNextApiRequest extends NextApiRequest {
  body: {
    url?: string;
  };
}

async function handler(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const body = req.body;
  let queryID: string | undefined = undefined;
  let wprs: number | undefined;

  if (!body.url) {
    return res.status(400).json({ error: "No link submitted" });
  }

  if (process.env.NODE_ENV === "production") {
    try {
      const res = await prisma.usage.create({ data: { compUrl: body.url } });
      queryID = res.id;
    } catch (error) {
      console.log(error);
    }
  }

  const url = sanitizeUrl(body.url);

  if (!isValidUrl(url))
    res.status(400).json({ error: "No valid URL submitted" });

  try {
    await limiter.check(res, SUBMIT_RATE_LIMIT, "CACHE_TOKEN");

    try {
      const forecast = await getWprs(url);
      if (forecast == 0) return res.status(204).end();
      wprs = forecast?.WPR;
      if (forecast) res.status(201).send(forecast);
      else throw new Error(`Could not calculate WPRS from URL: ${url}`);
    } catch (error) {
      console.log(error);
      res.status(500).json("Ooops… something went wrong");
    }
  } catch (error) {
    res.status(429).json({ error: "Rate limit exceeded" });
  }
  try {
    if (queryID && wprs) {
      await prisma.usage.update({
        where: { id: queryID },
        data: { wprs },
      });
    }
  } catch (error) {
    console.log(error);
  }
}
export default handler;

function isValidUrl(url: string) {
  if (url.includes("airtribune.com") || url.includes("civlcomps.org"))
    return true;
  return false;
}
