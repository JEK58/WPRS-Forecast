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

export type Forecast = {
  maxPilots: number;
  compTitle?: string;
  all?: CompForecast;
  confirmed?: CompForecast;
  compUrl: string;
  meta?: Statistics;
};

export type CompDetails = {
  pilots: Pilot[];
  compTitle?: string;
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
