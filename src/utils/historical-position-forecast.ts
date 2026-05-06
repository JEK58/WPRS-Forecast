const RECENCY_HALF_LIFE_DAYS = 730;
const HISTORICAL_PRIOR_WEIGHT = 2;
const DIRECT_PRIOR_WEIGHT = 0.5;
const WPRS_POINT_EXPONENT = 6;
const HISTORICAL_BLEND_WEIGHT = 6;
const DIRECT_BLEND_WEIGHT_WITH_WPRS = 8;
const DIRECT_BLEND_WEIGHT_WITHOUT_WPRS = 1;
const MAX_HISTORY_BLEND_WITH_WPRS = 0.2;
const MAX_DIRECT_BLEND_WITH_WPRS = 0.35;
const MAX_HISTORY_BLEND_WITHOUT_WPRS = 0.8;
const MAX_DIRECT_BLEND_WITHOUT_WPRS = 0.95;
const PAIR_PROBABILITY_FLOOR = 0.005;
const PAIR_PROBABILITY_CEILING = 1 - PAIR_PROBABILITY_FLOOR;
const EVENT_DISTRIBUTION_SHAPE_BY_CONFIDENCE = {
  low: 2,
  medium: 2.5,
  high: 3,
} satisfies Record<PositionForecastConfidence, number>;

export type PositionForecastConfidence = "low" | "medium" | "high";

export type HistoricalCompetitionResult = {
  competitionRowId: number;
  civlId: number;
  rank: number;
  numberOfPilots: number;
  endDate: string | Date;
};

export type HistoricalPositionForecastInput = {
  selectedCivlId: number;
  participantCivlIds: number[];
  historicalResults: HistoricalCompetitionResult[];
  rankingPointsByCivlId?: Map<number, number>;
  referenceDate?: Date;
};

export type HistoricalPositionForecast = {
  predictedPosition: number;
  expectedPlace: number;
  totalPilots: number;
  likelyRange: {
    lower: number;
    upper: number;
    probability: number;
  };
  winProbability: number;
  podiumProbability: number;
  topTenProbability: number;
  positionProbabilities: {
    position: number;
    probability: number;
  }[];
  confidence: PositionForecastConfidence;
  selectedPilotCompetitionCount: number;
  directComparisonCount: number;
  opponentHistoryCoverage: number;
};

type PilotStats = {
  competitionIds: Set<number>;
  weightedFinishSum: number;
  weightSum: number;
};

type PreparedResult = HistoricalCompetitionResult & {
  recencyWeight: number;
};

export function forecastHistoricalPosition({
  selectedCivlId,
  participantCivlIds,
  historicalResults,
  rankingPointsByCivlId = new Map(),
  referenceDate = new Date(),
}: HistoricalPositionForecastInput): HistoricalPositionForecast | undefined {
  if (!Number.isInteger(selectedCivlId) || selectedCivlId <= 0) return;

  const participants = dedupePositiveIds([selectedCivlId, ...participantCivlIds]);
  if (participants.length === 0) return;

  const preparedResults = historicalResults.map((result) => ({
    ...result,
    recencyWeight: calculateRecencyWeight(result.endDate, referenceDate),
  }));
  const statsByCivlId = buildPilotStats(preparedResults);
  const resultsByCompetition = buildResultsByCompetition(preparedResults);
  const selectedStats = statsByCivlId.get(selectedCivlId);
  const selectedStrength = calculateHistoricalStrength(selectedStats);
  let expectedPlace = 1;
  let directComparisonCount = 0;
  let opponentsWithHistory = 0;

  for (const opponentCivlId of participants) {
    if (opponentCivlId === selectedCivlId) continue;

    const opponentStats = statsByCivlId.get(opponentCivlId);
    if (opponentStats && opponentStats.competitionIds.size > 0) {
      opponentsWithHistory += 1;
    }

    const selectedBeatsOpponentProbability = calculatePairProbability({
      selectedCivlId,
      opponentCivlId,
      selectedStrength,
      opponentStrength: calculateHistoricalStrength(opponentStats),
      selectedStats,
      opponentStats,
      resultsByCompetition,
      rankingPointsByCivlId,
    });

    directComparisonCount += selectedBeatsOpponentProbability.directCount;
    const opponentBeatsProbability =
      1 - selectedBeatsOpponentProbability.probability;
    expectedPlace += opponentBeatsProbability;
  }

  const totalPilots = participants.length;
  const opponentCount = Math.max(0, totalPilots - 1);
  const opponentHistoryCoverage =
    opponentCount === 0 ? 1 : opponentsWithHistory / opponentCount;
  const confidence = calculateConfidence({
    selectedCompetitionCount: selectedStats?.competitionIds.size ?? 0,
    directComparisonCount,
    opponentHistoryCoverage,
  });
  const positionProbabilities = calculatePositionProbabilities({
    expectedPlace,
    totalPilots,
    confidence,
  });
  const predictedPosition = calculateMostLikelyPosition(positionProbabilities);
  const likelyRange = calculateCredibleRange(positionProbabilities, 0.8);

  return {
    predictedPosition,
    expectedPlace: round(expectedPlace, 2),
    totalPilots,
    likelyRange,
    winProbability: round(positionProbabilities[0]?.probability ?? 0, 4),
    podiumProbability: round(
      calculateCumulativeProbability(positionProbabilities, 3),
      4,
    ),
    topTenProbability: round(
      calculateCumulativeProbability(positionProbabilities, 10),
      4,
    ),
    positionProbabilities: positionProbabilities.map((entry) => ({
      position: entry.position,
      probability: round(entry.probability, 4),
    })),
    confidence,
    selectedPilotCompetitionCount: selectedStats?.competitionIds.size ?? 0,
    directComparisonCount,
    opponentHistoryCoverage: round(opponentHistoryCoverage, 2),
  };
}

function calculatePositionProbabilities({
  expectedPlace,
  totalPilots,
  confidence,
}: {
  expectedPlace: number;
  totalPilots: number;
  confidence: PositionForecastConfidence;
}) {
  if (totalPilots <= 0) return [];

  const meanOpponentsAhead = clamp(expectedPlace - 1, 0, totalPilots - 1);
  if (totalPilots === 1) {
    return [{ position: 1, probability: 1 }];
  }
  if (totalPilots === 2) {
    return [
      { position: 1, probability: 1 - meanOpponentsAhead },
      { position: 2, probability: meanOpponentsAhead },
    ];
  }
  if (meanOpponentsAhead === 0) {
    return Array.from({ length: totalPilots }, (_, index) => ({
      position: index + 1,
      probability: index === 0 ? 1 : 0,
    }));
  }

  const shape = EVENT_DISTRIBUTION_SHAPE_BY_CONFIDENCE[confidence];
  const successProbability = shape / (shape + meanOpponentsAhead);
  const failureProbability = 1 - successProbability;
  const distribution: number[] = [];
  let probability = successProbability ** shape;

  for (let opponentsAhead = 0; opponentsAhead < totalPilots; opponentsAhead++) {
    if (opponentsAhead > 0) {
      probability *=
        ((opponentsAhead - 1 + shape) / opponentsAhead) * failureProbability;
    }
    distribution.push(probability);
  }

  const probabilitySum = distribution.reduce((sum, entry) => sum + entry, 0);

  return distribution.map((probability, index) => ({
    position: index + 1,
    probability: probabilitySum > 0 ? probability / probabilitySum : 0,
  }));
}

function calculateMostLikelyPosition(
  positionProbabilities: { position: number; probability: number }[],
) {
  return positionProbabilities.reduce(
    (best, entry) => (entry.probability > best.probability ? entry : best),
    positionProbabilities[0] ?? { position: 1, probability: 1 },
  ).position;
}

function calculateCredibleRange(
  positionProbabilities: { position: number; probability: number }[],
  targetProbability: number,
) {
  if (positionProbabilities.length === 0) {
    return { lower: 1, upper: 1, probability: 1 };
  }

  let best = {
    lower: positionProbabilities[0]?.position ?? 1,
    upper: positionProbabilities[positionProbabilities.length - 1]?.position ?? 1,
    probability: 1,
  };

  for (let start = 0; start < positionProbabilities.length; start++) {
    let probability = 0;
    for (let end = start; end < positionProbabilities.length; end++) {
      probability += positionProbabilities[end]?.probability ?? 0;
      if (probability < targetProbability) continue;

      const lower = positionProbabilities[start]?.position ?? 1;
      const upper = positionProbabilities[end]?.position ?? lower;
      if (
        upper - lower < best.upper - best.lower ||
        (upper - lower === best.upper - best.lower &&
          probability > best.probability)
      ) {
        best = { lower, upper, probability };
      }
      break;
    }
  }

  return {
    lower: best.lower,
    upper: best.upper,
    probability: round(best.probability, 4),
  };
}

function calculateCumulativeProbability(
  positionProbabilities: { position: number; probability: number }[],
  maxPosition: number,
) {
  return positionProbabilities
    .filter((entry) => entry.position <= maxPosition)
    .reduce((sum, entry) => sum + entry.probability, 0);
}

function calculatePairProbability({
  selectedCivlId,
  opponentCivlId,
  selectedStrength,
  opponentStrength,
  selectedStats,
  opponentStats,
  resultsByCompetition,
  rankingPointsByCivlId,
}: {
  selectedCivlId: number;
  opponentCivlId: number;
  selectedStrength: number;
  opponentStrength: number;
  selectedStats?: PilotStats;
  opponentStats?: PilotStats;
  resultsByCompetition: Map<number, Map<number, PreparedResult>>;
  rankingPointsByCivlId: Map<number, number>;
}) {
  const direct = calculateDirectProbability({
    selectedCivlId,
    opponentCivlId,
    selectedStats,
    opponentStats,
    resultsByCompetition,
  });
  const historicalFallback = calculateStrengthProbability(
    selectedStrength,
    opponentStrength,
  );
  const wprsBaseline = calculateWprsBaselineProbability(
    selectedCivlId,
    opponentCivlId,
    rankingPointsByCivlId,
  );
  const sharedHistoryWeight = Math.min(
    selectedStats?.weightSum ?? 0,
    opponentStats?.weightSum ?? 0,
  );
  const historicalReliability =
    sharedHistoryWeight / (sharedHistoryWeight + HISTORICAL_BLEND_WEIGHT);
  const directBlendWeight = wprsBaseline.hasSignal
    ? DIRECT_BLEND_WEIGHT_WITH_WPRS
    : DIRECT_BLEND_WEIGHT_WITHOUT_WPRS;
  const directReliability = direct.weight / (direct.weight + directBlendWeight);
  const historicalBlend = historicalReliability *
    (wprsBaseline.hasSignal
      ? MAX_HISTORY_BLEND_WITH_WPRS
      : MAX_HISTORY_BLEND_WITHOUT_WPRS);
  const directBlend = directReliability *
    (wprsBaseline.hasSignal
      ? MAX_DIRECT_BLEND_WITH_WPRS
      : MAX_DIRECT_BLEND_WITHOUT_WPRS);
  const historyAdjustedProbability = blend(
    wprsBaseline.probability,
    historicalFallback,
    historicalBlend,
  );

  return {
    probability: clampPairProbability(
      blend(historyAdjustedProbability, direct.probability, directBlend),
    ),
    directCount: direct.count,
  };
}

function calculateDirectProbability({
  selectedCivlId,
  opponentCivlId,
  selectedStats,
  opponentStats,
  resultsByCompetition,
}: {
  selectedCivlId: number;
  opponentCivlId: number;
  selectedStats?: PilotStats;
  opponentStats?: PilotStats;
  resultsByCompetition: Map<number, Map<number, PreparedResult>>;
}) {
  if (!selectedStats || !opponentStats) {
    return { probability: 0.5, weight: 0, count: 0 };
  }

  let selectedWinWeight = 0;
  let totalWeight = 0;
  let count = 0;

  for (const competitionId of selectedStats.competitionIds) {
    if (!opponentStats.competitionIds.has(competitionId)) continue;

    const competitionResults = resultsByCompetition.get(competitionId);
    const selectedResult = competitionResults?.get(selectedCivlId);
    const opponentResult = competitionResults?.get(opponentCivlId);
    if (!selectedResult || !opponentResult) continue;

    count += 1;
    totalWeight += selectedResult.recencyWeight;
    if (selectedResult.rank < opponentResult.rank) {
      selectedWinWeight += selectedResult.recencyWeight;
    }
  }

  const probability =
    (selectedWinWeight + 0.5 * DIRECT_PRIOR_WEIGHT) /
    (totalWeight + DIRECT_PRIOR_WEIGHT);

  return { probability, weight: totalWeight, count };
}

function buildPilotStats(results: PreparedResult[]) {
  const statsByCivlId = new Map<number, PilotStats>();

  for (const result of results) {
    const existing = statsByCivlId.get(result.civlId) ?? {
      competitionIds: new Set<number>(),
      weightedFinishSum: 0,
      weightSum: 0,
    };

    existing.competitionIds.add(result.competitionRowId);
    existing.weightedFinishSum +=
      calculateFinishStrength(result.rank, result.numberOfPilots) *
      result.recencyWeight;
    existing.weightSum += result.recencyWeight;
    statsByCivlId.set(result.civlId, existing);
  }

  return statsByCivlId;
}

function buildResultsByCompetition(results: PreparedResult[]) {
  const resultsByCompetition = new Map<number, Map<number, PreparedResult>>();

  for (const result of results) {
    const competitionResults =
      resultsByCompetition.get(result.competitionRowId) ??
      new Map<number, PreparedResult>();
    competitionResults.set(result.civlId, result);
    resultsByCompetition.set(result.competitionRowId, competitionResults);
  }

  return resultsByCompetition;
}

function calculateHistoricalStrength(stats?: PilotStats) {
  if (!stats || stats.weightSum <= 0) return 0.5;

  return (
    (stats.weightedFinishSum + 0.5 * HISTORICAL_PRIOR_WEIGHT) /
    (stats.weightSum + HISTORICAL_PRIOR_WEIGHT)
  );
}

function calculateStrengthProbability(
  selectedStrength: number,
  opponentStrength: number,
) {
  return clamp(0.5 + (selectedStrength - opponentStrength) * 0.75, 0.08, 0.92);
}

function calculateWprsBaselineProbability(
  selectedCivlId: number,
  opponentCivlId: number,
  rankingPointsByCivlId: Map<number, number>,
) {
  const selectedPoints = rankingPointsByCivlId.get(selectedCivlId);
  const opponentPoints = rankingPointsByCivlId.get(opponentCivlId);

  if (
    typeof selectedPoints !== "number" ||
    typeof opponentPoints !== "number" ||
    selectedPoints < 0 ||
    opponentPoints < 0
  ) {
    return { probability: 0.5, hasSignal: false };
  }

  const selectedStrength = (selectedPoints + 1) ** WPRS_POINT_EXPONENT;
  const opponentStrength = (opponentPoints + 1) ** WPRS_POINT_EXPONENT;
  const denominator = selectedStrength + opponentStrength;
  const probability = denominator > 0 ? selectedStrength / denominator : 0.5;

  return { probability: clampPairProbability(probability), hasSignal: true };
}

function calculateFinishStrength(rank: number, numberOfPilots: number) {
  if (numberOfPilots <= 1) return 0.5;
  return clamp(1 - (rank - 1) / (numberOfPilots - 1), 0, 1);
}

function calculateRecencyWeight(endDate: string | Date, referenceDate: Date) {
  const parsedEndDate =
    endDate instanceof Date ? endDate : new Date(`${endDate}T00:00:00.000Z`);
  if (Number.isNaN(parsedEndDate.getTime())) return 0;

  const ageDays = Math.max(
    0,
    (referenceDate.getTime() - parsedEndDate.getTime()) / 86_400_000,
  );

  return 0.5 ** (ageDays / RECENCY_HALF_LIFE_DAYS);
}

function calculateConfidence({
  selectedCompetitionCount,
  directComparisonCount,
  opponentHistoryCoverage,
}: {
  selectedCompetitionCount: number;
  directComparisonCount: number;
  opponentHistoryCoverage: number;
}): PositionForecastConfidence {
  if (
    selectedCompetitionCount >= 8 &&
    directComparisonCount >= 12 &&
    opponentHistoryCoverage >= 0.6
  ) {
    return "high";
  }

  if (
    selectedCompetitionCount >= 3 &&
    directComparisonCount >= 3 &&
    opponentHistoryCoverage >= 0.35
  ) {
    return "medium";
  }

  return "low";
}

function dedupePositiveIds(ids: number[]) {
  return [
    ...new Set(
      ids.filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];
}

function blend(base: number, overlay: number, overlayWeight: number) {
  return base * (1 - overlayWeight) + overlay * overlayWeight;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampPairProbability(value: number) {
  return clamp(value, PAIR_PROBABILITY_FLOOR, PAIR_PROBABILITY_CEILING);
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
