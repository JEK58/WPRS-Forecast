export function isValidUrl(url: string) {
  return (
    url.includes("airtribune.com/") ||
    url.includes("civlcomps.org/event/") ||
    url.includes("pwca.org/events/") ||
    url.includes("swissleague.ch/comp-league/competitions")
  );
}
