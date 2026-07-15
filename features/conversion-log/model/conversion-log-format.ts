import { MoneyDecimal } from "@/features/converter/model/exchange";
import type { Conversion } from "./conversion-log";

const amountFormattersByFractionDigits = new Map<number, Intl.NumberFormat>();
const relativeDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const csvFileDateFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
  year: "numeric",
});

export function formatAmount(amount: string) {
  try {
    const decimal = new MoneyDecimal(amount);
    const fractionDigits = Math.max(0, decimal.decimalPlaces());
    let formatter = amountFormattersByFractionDigits.get(fractionDigits);

    if (!formatter) {
      formatter = new Intl.NumberFormat("en-US", {
        maximumFractionDigits: fractionDigits,
        minimumFractionDigits: fractionDigits,
      });
      amountFormattersByFractionDigits.set(fractionDigits, formatter);
    }

    return formatter.format(decimal.toNumber());
  } catch {
    return amount;
  }
}

export function formatRelativeTime(createdAt: string, now = new Date()) {
  const createdAtDate = new Date(createdAt);
  const elapsedMilliseconds = now.getTime() - createdAtDate.getTime();

  if (Number.isNaN(createdAtDate.getTime()) || elapsedMilliseconds < 0) {
    return "Now";
  }

  const elapsedMinutes = Math.floor(elapsedMilliseconds / 60_000);

  if (elapsedMinutes < 1) {
    return "Now";
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}M`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    return `${elapsedHours}H`;
  }

  return relativeDateFormatter.format(createdAtDate);
}

function escapeCsvCell(value: string) {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}

export function getConversionLogCsv(conversions: Conversion[]) {
  const rows = [
    ["created_at", "from_currency", "to_currency", "send_amount", "receive_amount"],
    ...conversions.map((conversion) => [
      conversion.createdAt,
      conversion.fromCurrency,
      conversion.toCurrency,
      conversion.sendAmount,
      conversion.receiveAmount,
    ]),
  ];

  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

export function getConversionLogCsvFileName(now = new Date()) {
  const date = csvFileDateFormatter.format(now);

  return `conversion-log-${date}.csv`;
}
