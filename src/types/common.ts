export interface Pilot {
  name?: string;
  nationality?: string;
  civlID?: number;
  wing?: string;
  status?: string;
  confirmed?: boolean;
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
  civlIds?: number[];
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
  compUrl: string;
  meta?: Statistics;
  compDate?: {
    startDate?: Date;
    endDate?: Date;
  };
  nationalities?: Nationalities;
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
