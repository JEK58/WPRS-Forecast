import { describe, it, expect } from "bun:test";

import { getAirtribuneComp } from "@/utils/get-airtribune-comp";

describe("Airtribune", () => {
  it("finds the correct comp date", async () => {
    const expectedStartDate = "2023-10-15T00:00:00.000Z";
    const expectedEndDate = "2023-10-21T00:00:00.000Z";

    const url = "https://airtribune.com/pre-world-cup-reunion-island-2023/info";
    const res = await getAirtribuneComp(url);

    expect(res?.compDate?.startDate?.toISOString()).toBe(expectedStartDate);
    expect(res?.compDate?.endDate?.toISOString()).toBe(expectedEndDate);
  });

  it("finds the correct comp date for comp dates spanning over two different months", async () => {
    const expectedStartDate = "2023-08-26T00:00:00.000Z";
    const expectedEndDate = "2023-09-02T00:00:00.000Z";

    const url = "https://airtribune.com/tennessee-paragliding-open-2023/";
    const res = await getAirtribuneComp(url);

    expect(res?.compDate?.startDate?.toISOString()).toBe(expectedStartDate);
    expect(res?.compDate?.endDate?.toISOString()).toBe(expectedEndDate);
  });
});
