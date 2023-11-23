import { getCivlIds, getCivlCookies } from "@/utils/get-civl-ids";

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

  expect(res.get(pilot)).toBe(expectedCivlId);
}, 10000);
