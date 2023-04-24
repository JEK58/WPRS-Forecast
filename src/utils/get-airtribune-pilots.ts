import type { Pilot } from "@/utils/calculate-wprs";

interface AirtribunePilot
  extends Omit<Pilot, "civlID" | "wing" | "nationality"> {
  country: { ioc_code: string };
  glider_model: string;
  civl_id: string;
}

export async function getAirtribunePilots(url: string) {
  try {
    const response = await fetch(url);
    const body = await response.text();

    const jsonRegex = /window\.ATDATA\.pilots\s*=\s*({[\s\S]*?});/;
    const match = body.match(jsonRegex);

    if (match && typeof match[1] == "string") {
      const jsonData = JSON.parse(match[1]) as { pilots: AirtribunePilot[] };

      const pilots = jsonData.pilots.map((el) => {
        return {
          name: el.name,
          nationality: el.country.ioc_code,
          civlID: parseInt(el.civl_id ?? "99999", 10),
          wing: el.glider_model,
          status: el.status,
          confirmed: isConfirmed(el.status),
        };
      });
      return pilots;
    } else {
      console.log("No JSON data found");
      return [];
    }
  } catch (error) {
    console.error(error);
    return [];
  }
}

function isConfirmed(status?: string) {
  return (
    status?.toLowerCase() == "confirmed" || status?.toLowerCase() == "wildcard"
  );
}
