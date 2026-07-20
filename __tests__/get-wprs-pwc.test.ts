import { describe, it, expect } from "bun:test";
import { getForecast } from "@/utils/get-forecast";
import { getPwcComp } from "@/utils/get-pwc-comp";

describe("Get WPRS for PWC comps", () => {
  it("should reject a comp that lies in the past", async () => {
    const url =
      "https://pwca.org/events/2025-paragliding-world-cup-north-macedonia-krushevo-2025";
    const res = await getForecast(url);
    expect(res).toHaveProperty("error");
    if ("error" in res) {
      expect(res.error).toBe("PAST_EVENT");
    }
  }, 80000);

  it("should get the correct amount of confirmed pilots", async () => {
    const url =
      "https://pwca.org/events/2025-paragliding-world-cup-north-macedonia-krushevo-2025";
    const res = await getPwcComp(url);

    expect(res).toBeDefined();
    if (!res) throw new Error("Expected PWC competition response");
    expect(res.pilots.filter((p) => p.confirmed).length).toBe(133);
  }, 80000);

  it("should not mark pending pilots from the livewire selection table as confirmed", async () => {
    const url =
      "https://pwca.org/events/2025-15th-paragliding-world-cup-superfinal-2025-spain-pegalajar";
    const res = await getPwcComp(url);

    expect(res).toBeDefined();
    if (!res) throw new Error("Expected PWC competition response");
    const paymentInProgress = res.pilots.filter(
      (p) => p.status === "Payment in Progress",
    );
    const waitingForPayment = res.pilots.filter(
      (p) => p.status === "Waiting for Payment",
    );

    expect(
      [...paymentInProgress, ...waitingForPayment].every((p) => !p.confirmed),
    ).toBe(true);
  }, 80000);

  it("should treat waiting list pilots as registered but unconfirmed", async () => {
    const url =
      "https://pwca.org/events/2026-paragliding-world-cup-italy-gemona-2026";
    const res = await getPwcComp(url);

    expect(res).toBeDefined();
    if (!res) throw new Error("Expected PWC competition response");
    const waitingList = res.pilots.filter((p) => p.status === "Waiting List");

    expect(waitingList.length).toBeGreaterThan(0);
    expect(waitingList.every((p) => !p.confirmed)).toBe(true);
  }, 80000);

  // it("should get the correct amount of confirmed pilots", async () => {
  //   const url = "https://pwca.events/world-cup-gourdon-france-2024/selection";
  //   const res = await getPwcComp(url);
  //   expect(res).toBeDefined();
  //   if (!res) throw new Error("Expected PWC competition response");
  //   expect(res.pilots.filter((p) => p.confirmed).length).toBe(103);
  // }, 20000);

  // Let's see how the new page develops
  // it("should get the correct URL for the new events page", async () => {
  //   const url = "https://pwca.events";
  //   const res = await getWprs(url);
  //   console.log("🚀 ~ res:", res);

  //   if ("all" in res) expect(res.confirmed?.numPilots).toBe(97);
  //   else throw "No result found";
  // }, 12000);
});
