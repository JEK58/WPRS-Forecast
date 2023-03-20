export function isValidUrl(url: string) {
  return (
    url.includes("airtribune.com/") ||
    url.includes("civlcomps.org/event/") ||
    url.includes("pwca.org/events/")
  );
}
