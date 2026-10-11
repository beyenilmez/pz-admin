type SupportedUnit = "byte" | "kilogram" | "kilometer-per-hour";

const decimalFormatters = new Map<string, Intl.NumberFormat>();
const unitFormatters = new Map<string, Intl.NumberFormat>();

export function formatNumber(locale: string, value: number) {
  let formatter = decimalFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale);
    decimalFormatters.set(locale, formatter);
  }
  return formatter.format(value);
}

export function formatUnit(locale: string, value: number, unit: SupportedUnit) {
  const key = `${locale}:${unit}`;
  let formatter = unitFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: "unit",
      unit,
      unitDisplay: "short",
    });
    unitFormatters.set(key, formatter);
  }
  return formatter.format(value);
}
