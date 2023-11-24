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
}

export type Forecast = {
  maxPilots: number;
  compTitle?: string;
  all?: CompForecast;
  confirmed?: CompForecast;
  compUrl: string;
};
