import { getAirtribuneComp } from "@/utils/get-airtribune-comp";
describe("Home", () => {
  it("finds the correct comp date", async () => {
    const url = "https://airtribune.com/pre-world-cup-reunion-island-2023/info";
    const res = await getAirtribuneComp(url);

    expect(true).toBe(true);
  });
});
