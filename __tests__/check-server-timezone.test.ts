import { describe, it, expect } from "bun:test";

describe("Timezone", () => {
  it("should always be UTC", () => {
    expect(new Date().getTimezoneOffset()).toBe(0);
  });
});
