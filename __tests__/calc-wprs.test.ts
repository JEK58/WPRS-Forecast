import { getCivlcompsComp } from "@/utils/get-civl-comp";
import { getCivlId } from "@/utils/get-civl-id";
import { env } from "@/env.mjs";
import Redis from "ioredis";

const redis = new Redis({ host: env.REDIS_URL });
// beforeAll(async () => await redis.flushall());

it("should find the correct amount of registered pilots", async () => {
  const expectedNumOfPilots = 293;
  const startTime = performance.now();
  console.log("⏱️ ~ ", "Timer started");

  // Test
  const url = "https://civlcomps.org/event/german-open-2023/participants";

  const detailsUrl = "https://civlcomps.org/event/german-open-2023";
  const res = await getCivlcompsComp(url, detailsUrl);

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

  const id = await getCivlId(pilot);

  // Perfomance Timer
  const endTime = performance.now();
  const elapsedTime = endTime - startTime;
  console.log("⏱️ ~ ", (elapsedTime / 1000).toFixed(2), "seconds");

  // Test
  expect(id).toBe(expectedCivlId);
}, 10000);
