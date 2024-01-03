import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPosition(string: string, subString: string, index: number) {
  return string.split(subString, index).join(subString).length;
}
