import type { NextApiRequest, NextApiResponse } from "next";

type HealthResponse = {
  status: "ok";
  timestamp: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse | { message: string }>,
) {
  if (req.method === "HEAD") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ message: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
