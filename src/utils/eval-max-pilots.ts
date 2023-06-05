// If no max num of pilots is specified use the typical number of 120

const MAX_PILOTS = 120;

export function evalMaxPilots(num: number) {
  return num === 0 ? MAX_PILOTS : num;
}
