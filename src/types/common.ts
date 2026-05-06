import type { Ranking } from "@/utils/calculate-wprs";
export interface Pilot {
  name?: string;
  nationality?: string;
  civlID?: number;
  wing?: string;
  status?: string;
  confirmed?: boolean;
  rank?: number;
}

export interface CompForecast {
  worldRankingDate: Date;
  numPilots: number;
  Pq: number;
  Pq_srp: number;
  Pq_srtp: number;
  Pn: number;
  compRanking: number;
  WPRS: { Ta1: number; Ta2: number; Ta3: number }[];
  pilots?: Ranking[];
}

export interface Nationalities {
  count: Record<string, number>;
  percentage: Record<string, string>;
}

export type Forecast = {
  maxPilots: number;
  compTitle?: string;
  pilotsUrl?: string;
  all?: CompForecast;
  confirmed?: CompForecast;
  confirmedPilots?: Pilot[];
  registeredPilots?: Pilot[];
  compUrl: string;
  meta?: Statistics;
  compDate?: {
    startDate?: Date;
    endDate?: Date;
  };
  nationalities?: Nationalities;
  genders?: { male: number; female: number };
};

export type CompDetails = {
  pilots: Pilot[];
  compTitle?: string;
  pilotsUrl?: string;
  maxPilots: number;
  compDate?: {
    startDate?: Date;
    endDate?: Date;
  };
  statistics?: Statistics;
};

export type Statistics = {
  numberOfPilots: number;
  missingInCache: number;
  missingInDB: number;
  missingInMinisearch: number;
  missingInAlgolia: number;
  percentageNotFound: number;
  civlSearchDurationInMs: number;
  pilotsNotfound: string[];
};

export type ForecastSimulation = {
  confirmed?: CompForecast;
  nationalities?: Nationalities;
  genders?: { male: number; female: number };
  contributions?: Record<string, number | null>;
};

export type PositionForecastScenario = {
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
  confidence: "low" | "medium" | "high";
  selectedPilotCompetitionCount: number;
  directComparisonCount: number;
  opponentHistoryCoverage: number;
};

export type PositionForecastRequestContext = {
  competitionUrl?: string;
  pilotsUrl?: string;
  competitionTitle?: string;
  startDate?: string;
  endDate?: string;
};

export type PositionForecastResponse = {
  scenarios: {
    confirmed?: PositionForecastScenario | null;
    registered?: PositionForecastScenario | null;
  };
};
