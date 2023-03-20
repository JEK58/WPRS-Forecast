import { lookupCivlId } from "@/utils/lookup-civl-id";

interface PWCApiResponse {
  subscriptions?: PilotDetails[];
  isSelectionStarted: boolean;
  subscriptionStatusesOrder?: SubscriptionStatusesOrder[];
}

type SubscriptionStatusesOrder =
  | "Confirmed"
  | "Wildcard Confirmed"
  | "Guest Card Confirmed"
  | "Payment in Progress"
  | "Waiting for Payment"
  | "Wildcard"
  | "Guest Card"
  | "Waiting List"
  | "Cancelled"
  | "Late Cancelled";

type SubscriptionStatusKeys =
  | "confirmed"
  | "wildcard_confirmed"
  | "guest_card_confirmed"
  | "payment_in_progress"
  | "waiting_for_payment"
  | "wildcard"
  | "guest_card"
  | "waiting_list"
  | "cancelled"
  | "late_cancelled";

export interface PilotDetails {
  season_number?: number | string;
  pilot?: string;
  country?: string;
  country_flag?: string;
  glider?: string;
  harness?: string;
  sponsor?: string;
  status?: string;
  status_key?: SubscriptionStatusKeys;
  is_late?: boolean;
  qualification_letters?: string;
}

export async function getPwcPilots(url: string) {
  const apiUrl = url.replace("pwca.org", "pwca.org/api");
  const femaleApiUrl = apiUrl + "?gender=female";

  const [maleRes, femaleRes] = await Promise.all([
    await fetch(apiUrl),
    await fetch(femaleApiUrl),
  ]);
  const male = (await maleRes.json()) as PWCApiResponse;
  const female = (await femaleRes.json()) as PWCApiResponse;

  const mergedData = [
    ...(male.subscriptions ?? []),
    ...(female.subscriptions ?? []),
  ];

  if (!mergedData.length) return [];
  const confirmedPilots = mergedData.filter((el) => {
    return (
      el.status_key == "confirmed" ||
      el.status_key == "wildcard" ||
      el.status_key == "guest_card_confirmed"
    );
  });

  const pilots = await Promise.all(
    confirmedPilots.map(async (el) => {
      const input = el.pilot ?? "";
      const name = input.split(" (")[0] ?? "";
      const civlID = await lookupCivlId(name);

      return {
        name,
        nationality: el.country,
        civlID,
        wing: el.glider,
        status: el.status,
      };
    })
  );

  return pilots;
}
