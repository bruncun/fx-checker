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
