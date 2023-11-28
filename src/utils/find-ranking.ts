import { prisma } from "@/server/db";
import { type Ranking } from "@prisma/client";
import Fuse from "fuse.js";
import { writeFileSync } from "fs";

export async function getCivlIds(pilots: string[]) {
  const map = new Map<string, number>();

  console.log("🚀 ~ Number of pilots:", pilots.length);

  const res = await prisma.ranking.findMany({
    where: {
      name: { in: pilots, mode: "insensitive" },
    },
  });

  console.log("🚀 ~ Number of pilots found in DB:", res.length);

  const pilotsNotFound = pilots.filter(
    (name) => !res.find((p) => p.name.toLowerCase() === name.toLowerCase()),
  );

  writeFileSync("pilotsNotFound.json", JSON.stringify(pilotsNotFound));

  console.log("🚀 ~ Number of pilots not found in DB:", pilotsNotFound.length);

  //   Find missing pilots locally with Fuse.js

  const options = {
    includeScore: true,
    keys: ["name"],
  };
  const myIndex = Fuse.createIndex(options.keys, res);

  const fuse = new Fuse(res, options, myIndex);

  const fakeList = ["Stephan Schöpe", "Schöpe Stephan", "David Polo"];

  for (const pilot of pilotsNotFound) {
    const res = findPilotWithFuse(fuse, pilot);

    if (res) {
      //   console.log(pilot, res.name);

      map.set(pilot, res.id);
      // console.log(foo.name);
    } //else console.log(pilot, "not found with fuse");
  }

  console.log("🚀 ~ Pilots found with fuse:", map.size);

  //   Find missing pilots with levenshtein distance

  //   const foo = await findPilotsInDb(pilotsNotFound);
  //   console.log("🚀 ~ Pilots found with levenshtein:", foo.length);
}

export async function findPilotsInDb(names: string[]) {
  const res = await prisma.$transaction(
    names.map((name) => {
      const reversed = reverseFirstAndLast(name);
      return prisma.$queryRaw<Ranking[]>`
        SELECT
          *,
          (distance1 + distance2) AS total_distance
          FROM (
              SELECT
                  *,
                  levenshtein(lower("name"), lower(${name})) AS distance1,
                  levenshtein(lower("name"), lower(${reversed})) AS distance2
              FROM
                  "Ranking"
          ) AS distances
          ORDER BY
          total_distance ASC
          LIMIT 1;
          `;
    }),
  );

  return res.map((r) => r[0]);
}

export async function findPilotInDb(name: string) {
  const reversed = reverseFirstAndLast(name);
  const res = await prisma.$queryRaw<Ranking[]>`
  SELECT
    *,
    (distance1 + distance2) AS total_distance
    FROM (
        SELECT
            *,
            levenshtein(lower("name"), lower(${name})) AS distance1,
            levenshtein(lower("name"), lower(${reversed})) AS distance2
        FROM
            "Ranking"
    ) AS distances
    ORDER BY
    total_distance ASC
    LIMIT 1;
    `;
  if (res) return res[0];
}

function findPilotWithFuse(fuse: Fuse<Ranking>, name: string) {
  const res = fuse.search(
    {
      $and: [{ name }, { name: reverseFirstAndLast(name) }],
    },
    { limit: 1 },
  );
  if (res[0]?.score && res[0]?.score > 0.3) return;
  return res[0]?.item;
}

export function findPilot(name: string, pilots: Ranking[]) {
  const options = {
    includeScore: true,
    keys: ["name"],
  };

  const fuse = new Fuse(pilots, options);

  //   // Perfomance timer
  //   const startTime = performance.now();
  //   console.log("⏱️ ~ ", "Timer started");
  const res = fuse.search(
    {
      $and: [{ name }, { name: reverseFirstAndLast(name) }],
    },
    { limit: 1 },
  );

  //   // Perfomance Timer
  //   const endTime = performance.now();
  //   const elapsedTime = endTime - startTime;
  //   console.log("⏱️ ~ ", (elapsedTime / 1000).toFixed(2), "seconds");
  //   console.log("🚀 ~ result:", result1);
  //   console.log("🚀 ~ result:", result2);

  return res[0]?.item; //result[0]?.item;
}

function reverseFirstAndLast(inputString: string): string {
  const words: string[] = inputString.split(" ");

  if (words.length >= 2) {
    const temp = words[0];

    if (temp) {
      const last = words[words.length - 1];
      if (last) words[0] = last;

      words[words.length - 1] = temp;
    }
  }

  return words.join(" ");
}
