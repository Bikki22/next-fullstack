/**
 * Money is stored as integer cents everywhere — no floats, no Decimal
 * serialization surprises when values cross the network.
 */
const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatMoney = (cents: number) => currency.format(cents / 100);

export const toCents = (amount: number) => Math.round(amount * 100);

export const fromCents = (cents: number) => cents / 100;

const dateTime = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

const dateOnly = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

export const formatDateTime = (value: Date | string) =>
  dateTime.format(new Date(value));

export const formatDate = (value: Date | string) =>
  dateOnly.format(new Date(value));

const compact = new Intl.NumberFormat("en-IN", { notation: "compact" });

export const formatCompact = (value: number) => compact.format(value);

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
