import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Performs a deep comparison between two objects to determine if they are equal.
 * @param obj1 - The first object to compare.
 * @param obj2 - The second object to compare.
 * @returns true if objects are equal, false otherwise.
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (typeof obj1 !== "object" || typeof obj2 !== "object" || obj1 === null || obj2 === null) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}

export function isEmpty(obj: any): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Ensures a number has at least one decimal place.
 * Converts non-numeric values gracefully.
 *
 * @param value - The input value to format.
 * @returns A string representation of the value with at least one decimal place.
 */
export function formatWithMinimumOneDecimal(value: any): string {
  const numericValue = Number(value);
  if (isNaN(numericValue)) {
    return "";
  }
  return numericValue % 1 === 0 ? `${numericValue}.0` : String(numericValue).replace(",", ".");
}

export function formatString(string: string, ...args: any[]): string {
  string = string.replace(new RegExp("%%", "g"), "<<percent>>");
  for (let i = 0; i < args.length; i++) {
    string = string.replace(/%[a-z]/, args[i]);
  }
  string = string.replace(new RegExp("<<percent>>", "g"), "%");
  return string;
}
