describe("Timezones", () => {
  it("should always be UTC", () => {
    console.log(process.env);
    expect(new Date().getTimezoneOffset()).toBe(0);
  });
});
