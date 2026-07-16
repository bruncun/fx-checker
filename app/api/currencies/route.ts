import { getCurrencyReferenceData } from "@/features/exchange-rates/api/server";
import { NextResponse } from "next/server";

export async function GET() {
  const currencyReferenceData = await getCurrencyReferenceData();

  if (currencyReferenceData.status === "unavailable") {
    return NextResponse.json({ error: "Currency data unavailable" }, { status: 503 });
  }

  return NextResponse.json({
    availableCurrencies: currencyReferenceData.availableCurrencies,
  });
}
