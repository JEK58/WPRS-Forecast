export function isValidUrl(url: string) {
  if (!validateHttpsLink(url)) return false;
  return (
    (url.includes("airtribune.com/") ||
      url.includes("civlcomps.org/event/") ||
      url.includes("pwca.org/events/") ||
      url.includes("pwca.events") ||
      url.includes("swissleague.ch/comp-league/competitions")) &&
    !url.includes("wprs-forecast")
  );
}

function validateHttpsLink(link: string) {
  const regex =
    /^https:\/\/[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;
  return regex.test(link);
}
