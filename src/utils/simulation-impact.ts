const AVG_NUM_PARTICIPANTS = 76;
const PQ_MIN = 0.2;
const PN_MAX = 1.2;

type SimPilot = {
  key: string;
  civlId?: number;
};

type RankedPilot = {
  points: number;
};

type WinnerScoreArgs = {
  allPilots: SimPilot[];
  scenarioPilotKeys: Set<string>;
  rankedByCivlId: Map<number, RankedPilot>;
  topWorldPrefixSums: number[];
};

function getScenarioRankedPoints(
  allPilots: SimPilot[],
  scenarioPilotKeys: Set<string>,
  rankedByCivlId: Map<number, RankedPilot>,
) {
  const seenCivlIds = new Set<number>();
  const rankedPoints: number[] = [];

  for (const pilot of allPilots) {
    if (!scenarioPilotKeys.has(pilot.key)) continue;
    if (typeof pilot.civlId !== "number" || pilot.civlId <= 0) continue;
    if (seenCivlIds.has(pilot.civlId)) continue;

    seenCivlIds.add(pilot.civlId);

    const ranked = rankedByCivlId.get(pilot.civlId);
    if (!ranked) continue;
    rankedPoints.push(ranked.points);
  }

  return rankedPoints.sort((a, b) => b - a);
}

export function computeScenarioWinnerTa3({
  allPilots,
  scenarioPilotKeys,
  rankedByCivlId,
  topWorldPrefixSums,
}: WinnerScoreArgs) {
  const scenarioCount = scenarioPilotKeys.size;
  if (scenarioCount < 2) return 0;

  const topHalfCount = Math.floor(scenarioCount / 2);
  if (topHalfCount < 1) return 0;

  const pqsrtp = topWorldPrefixSums[topHalfCount] ?? 0;
  if (pqsrtp <= 0) return 0;

  const pqsrp = getScenarioRankedPoints(
    allPilots,
    scenarioPilotKeys,
    rankedByCivlId,
  )
    .slice(0, topHalfCount)
    .reduce((sum, points) => sum + points, 0);

  const pq = (pqsrp / pqsrtp) * (1 - PQ_MIN) + PQ_MIN;
  const pnTmp = Math.sqrt(scenarioCount / Math.min(AVG_NUM_PARTICIPANTS, 55));
  const pn = pnTmp > PN_MAX ? PN_MAX : pnTmp;

  return 100 * pq * pn;
}

type ImpactArgs = {
  allPilots: SimPilot[];
  selectedPilotKeys: string[];
  rankedByCivlId: Map<number, RankedPilot>;
  topWorldPrefixSums: number[];
};

type FixedFieldScoreArgs = {
  allPilots: SimPilot[];
  scenarioPilotKeys: Set<string>;
  rankedByCivlId: Map<number, RankedPilot>;
  fixedTopHalfCount: number;
  fixedPqsrtp: number;
  fixedPn: number;
};

function computeFixedFieldWinnerTa3({
  allPilots,
  scenarioPilotKeys,
  rankedByCivlId,
  fixedTopHalfCount,
  fixedPqsrtp,
  fixedPn,
}: FixedFieldScoreArgs) {
  if (fixedTopHalfCount < 1 || fixedPqsrtp <= 0) return 0;

  const pqsrp = getScenarioRankedPoints(
    allPilots,
    scenarioPilotKeys,
    rankedByCivlId,
  )
    .slice(0, fixedTopHalfCount)
    .reduce((sum, points) => sum + points, 0);

  const pq = (pqsrp / fixedPqsrtp) * (1 - PQ_MIN) + PQ_MIN;
  return 100 * pq * fixedPn;
}

export function computeImpactContributions({
  allPilots,
  selectedPilotKeys,
  rankedByCivlId,
  topWorldPrefixSums,
}: ImpactArgs) {
  const selectedPilotSet = new Set(selectedPilotKeys);
  const selectedCount = selectedPilotSet.size;
  const scenarioScoreCache = new Map<string, number>();
  const pairContextCache = new Map<
    number,
    { topHalfCount: number; pqsrtp: number; pn: number }
  >();
  const epsilon = 0.0000001;

  const getPairContext = (pairCount: number) => {
    const cached = pairContextCache.get(pairCount);
    if (cached) return cached;

    const topHalfCount = Math.floor(pairCount / 2);
    const pqsrtp = topWorldPrefixSums[topHalfCount] ?? 0;
    const pnTmp = Math.sqrt(pairCount / Math.min(AVG_NUM_PARTICIPANTS, 55));
    const pn = pnTmp > PN_MAX ? PN_MAX : pnTmp;
    const context = { topHalfCount, pqsrtp, pn };
    pairContextCache.set(pairCount, context);
    return context;
  };

  const getScenarioScore = (
    scenarioPilotKeys: Set<string>,
    pairCount: number,
  ) => {
    const cacheKey = `${pairCount}|${[...scenarioPilotKeys].sort().join("|")}`;
    const cached = scenarioScoreCache.get(cacheKey);
    if (typeof cached === "number") return cached;

    const context = getPairContext(pairCount);
    const winnerTa3 = computeFixedFieldWinnerTa3({
      allPilots,
      scenarioPilotKeys,
      rankedByCivlId,
      fixedTopHalfCount: context.topHalfCount,
      fixedPqsrtp: context.pqsrtp,
      fixedPn: context.pn,
    });
    scenarioScoreCache.set(cacheKey, winnerTa3);
    return winnerTa3;
  };

  const contributions: Record<string, number> = {};

  for (const pilot of allPilots) {
    const isSelected = selectedPilotSet.has(pilot.key);

    const scenarioPilotKeys = isSelected
      ? new Set(
          [...selectedPilotSet].filter(
            (selectedPilotKey) => selectedPilotKey !== pilot.key,
          ),
        )
      : new Set([...selectedPilotSet, pilot.key]);

    const pairCount = Math.max(selectedCount, scenarioPilotKeys.size);
    const currentScore = getScenarioScore(selectedPilotSet, pairCount);
    const toggledScore = getScenarioScore(scenarioPilotKeys, pairCount);
    const contribution = isSelected
      ? currentScore - toggledScore
      : toggledScore - currentScore;

    if (contribution <= epsilon) {
      contributions[pilot.key] = 0;
      continue;
    }
    contributions[pilot.key] = contribution;
  }

  return contributions;
}

export function buildPrefixSums(points: number[]) {
  const prefix = [0];

  for (const point of points) {
    const previous = prefix[prefix.length - 1] ?? 0;
    prefix.push(previous + point);
  }

  return prefix;
}
