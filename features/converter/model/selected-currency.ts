import type { FlagCountryCode } from "@/components/ui/flag";

export type SelectedCurrency = {
  countryCode?: FlagCountryCode;
  currencyCode: string;
};
