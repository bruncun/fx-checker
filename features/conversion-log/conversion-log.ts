export type ConversionCurrencyPair = {
  fromCurrency: string;
  toCurrency: string;
};

export type Conversion = ConversionCurrencyPair & {
  createdAt: string;
  id: string;
  receiveAmount: string;
  sendAmount: string;
};

export type CreateConversionInput = ConversionCurrencyPair & {
  receiveAmount: string;
  sendAmount: string;
};

export type ConversionRow = {
  created_at: string;
  from_currency: string;
  id: string;
  receive_amount: string;
  send_amount: string;
  to_currency: string;
};

export class InvalidConversionInputError extends Error {
  constructor() {
    super("Conversion must contain two distinct currency codes and non-empty amounts.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mapConversion(row: ConversionRow): Conversion {
  return {
    createdAt: row.created_at,
    fromCurrency: row.from_currency,
    id: row.id,
    receiveAmount: row.receive_amount,
    sendAmount: row.send_amount,
    toCurrency: row.to_currency,
  };
}

function normalizeCurrencyCode(code: string) {
  return code.trim().toUpperCase();
}

function normalizeAmount(amount: string) {
  return amount.trim().replaceAll(",", "");
}

export function normalizeConversionInput(input: CreateConversionInput): CreateConversionInput {
  return {
    fromCurrency: normalizeCurrencyCode(input.fromCurrency),
    receiveAmount: normalizeAmount(input.receiveAmount),
    sendAmount: normalizeAmount(input.sendAmount),
    toCurrency: normalizeCurrencyCode(input.toCurrency),
  };
}

export function parseCreateConversionInput(value: unknown): CreateConversionInput {
  if (
    !isRecord(value) ||
    typeof value.fromCurrency !== "string" ||
    typeof value.toCurrency !== "string" ||
    typeof value.sendAmount !== "string" ||
    typeof value.receiveAmount !== "string"
  ) {
    throw new InvalidConversionInputError();
  }

  const input = normalizeConversionInput({
    fromCurrency: value.fromCurrency,
    receiveAmount: value.receiveAmount,
    sendAmount: value.sendAmount,
    toCurrency: value.toCurrency,
  });

  if (
    !/^[A-Z]{3}$/.test(input.fromCurrency) ||
    !/^[A-Z]{3}$/.test(input.toCurrency) ||
    input.fromCurrency === input.toCurrency ||
    input.sendAmount.length === 0 ||
    input.receiveAmount.length === 0 ||
    input.sendAmount.length > 64 ||
    input.receiveAmount.length > 64
  ) {
    throw new InvalidConversionInputError();
  }

  return input;
}
