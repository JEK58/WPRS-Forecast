import { getCivlcompsComp } from "@/utils/get-civl-comp";
import { getCivlIds, getCivlCookies } from "@/utils/get-civl-ids";
// import { env } from "@/env.mjs";
// import Redis from "ioredis";

// const redis = new Redis({ host: env.REDIS_URL });
// beforeAll(async () => await redis.flushall());

it("should find the correct amount of registered pilots", async () => {
  const expectedNumOfPilots = 291;
  const startTime = performance.now();
  console.log("⏱️ ~ ", "Timer started");

  // Test
  const url = "https://civlcomps.org/event/german-open-2023/participants";

  const res = await getCivlcompsComp(url);

  //
  const endTime = performance.now();
  const elapsedTime = endTime - startTime;
  console.log("⏱️ ~ ", (elapsedTime / 1000).toFixed(2), "seconds");

  expect(res.pilots.length).toBe(expectedNumOfPilots);
}, 30000);

it("should find the correct CIVL ID for a pilot", async () => {
  // Perfomance timer
  const startTime = performance.now();
  console.log("⏱️ ~ ", "Timer started");

  // Test
  const pilot = "Stephan Schöpe";
  const expectedCivlId = 39705;

  const list = [{ name: pilot }];

  // Get CIVL cookies
  const cookies = await getCivlCookies();
  if (!cookies) throw new Error("No cookies found");

  const res = await getCivlIds(list);

  // Perfomance Timer
  const endTime = performance.now();
  const elapsedTime = endTime - startTime;
  console.log("⏱️ ~ ", (elapsedTime / 1000).toFixed(2), "seconds");

  // Test
  expect(res.get(pilot)).toBe(expectedCivlId);
}, 10000);
