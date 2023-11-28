import { findPilot, getCivlIds } from "@/utils/find-ranking";
import { pilots } from "./data/pwcPilots";
import { type Ranking } from "@prisma/client";
import { prisma } from "@/server/db";
import { pilotsNotFound } from "./data/pilotsNotFoundInDb";
import { contains } from "node_modules/cheerio/lib/esm/static";

describe("Lookup pilots by name", () => {
  it("bla", async () => {
    const res = await getCivlIds(pilots.flatMap((p) => p.name));
    console.log(res);
  }, 20000);

  // it("bla", async () => {
  //   const res = await prisma.ranking.findMany({
  //     where: { name: { contains: "peter budai", mode: "insensitive" } },
  //     // where: {
  //     //   name: { in: pilotsNotFound, mode: "insensitive" },
  //     // },
  //   });
  //   console.log(res);
  // }, 20000);

  // it("should find the correct pilot with exact name", async () => {
  //   const name = "Stephan Schöpe";
  //   const expectedPilotCivl = 39705;

  //   const res = await findPilot(name);

  //   expect(res?.id).toBe(expectedPilotCivl);
  // });

  // it("should find the correct pilot with exact name", async () => {
  //   const name = "Anatolii Mykhailiyuta";
  //   const expectedPilotCivl = 17523;
  //   const res = await findPilot(name);

  //   expect(res?.id).toBe(expectedPilotCivl);
  // });

  // it("should find the correct pilot without umlauts", async () => {
  //   const name = "Stephan Schoepe";
  //   const expectedPilotCivl = 39705;
  //   const res = await findPilot(name);

  //   expect(res?.id).toBe(expectedPilotCivl);
  // });

  // it("should find the correct pilot without reverse name", async () => {
  //   const name = "Schöpe Stephan";
  //   const expectedPilotCivl = 39705;
  //   const res = await findPilot(name);

  //   expect(res?.id).toBe(expectedPilotCivl);
  // });

  // it("should find the correct pilot with typos", async () => {
  //   const name = "Stepfan Schöpes";
  //   const expectedPilotCivl = 39705;
  //   const res = await findPilot(name);

  //   expect(res?.id).toBe(expectedPilotCivl);
  // });
});
