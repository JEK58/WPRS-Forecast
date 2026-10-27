type CompetitionDates = {
  startDate?: Date;
  endDate?: Date;
};

export function isValidCompetitionDateRange(
  dates?: CompetitionDates,
): dates is { startDate: Date; endDate: Date } {
  return !!(
    dates?.startDate &&
    dates.endDate &&
    Number.isFinite(dates.startDate.getTime()) &&
    Number.isFinite(dates.endDate.getTime()) &&
    dates.startDate <= dates.endDate
  );
}

export function getCompetitionMonthStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function getCompetitionDateError(
  dates?: CompetitionDates,
  now = new Date(),
) {
  if (!isValidCompetitionDateRange(dates)) {
    return "COMPETITION_DATES_UNAVAILABLE";
  }

  // Keep this month's events available, matching the existing forecast policy.
  if (dates.endDate < getCompetitionMonthStart(now)) return "PAST_EVENT";
}
