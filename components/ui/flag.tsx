import * as React from "react";

import { cx } from "@/lib/cx";
import Image from "next/image";

export const flagCountryNames = {
  ae: "United Arab Emirates",
  ar: "Argentina",
  au: "Australia",
  bd: "Bangladesh",
  bg: "Bulgaria",
  bh: "Bahrain",
  br: "Brazil",
  ca: "Canada",
  ch: "Switzerland",
  cl: "Chile",
  cn: "China",
  co: "Colombia",
  cy: "Cyprus",
  cz: "Czechia",
  dk: "Denmark",
  eg: "Egypt",
  eu: "European Union",
  gb: "United Kingdom",
  hk: "Hong Kong",
  hm: "Heard Island and McDonald Islands",
  hn: "Honduras",
  hr: "Croatia",
  ht: "Haiti",
  hu: "Hungary",
  id: "Indonesia",
  in: "India",
  is: "Iceland",
  jo: "Jordan",
  jp: "Japan",
  ke: "Kenya",
  kr: "South Korea",
  kw: "Kuwait",
  lb: "Lebanon",
  lc: "Saint Lucia",
  lk: "Sri Lanka",
  ma: "Morocco",
  mx: "Mexico",
  my: "Malaysia",
  ng: "Nigeria",
  no: "Norway",
  np: "Nepal",
  nz: "New Zealand",
  om: "Oman",
  pe: "Peru",
  ph: "Philippines",
  pk: "Pakistan",
  pl: "Poland",
  qa: "Qatar",
  ro: "Romania",
  ru: "Russia",
  sa: "Saudi Arabia",
  se: "Sweden",
  sg: "Singapore",
  th: "Thailand",
  tr: "Turkey",
  tw: "Taiwan",
  ua: "Ukraine",
  us: "United States",
  vn: "Vietnam",
  za: "South Africa",
} as const;

export type FlagCountryCode = keyof typeof flagCountryNames;

export interface FlagProps extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "alt" | "height" | "src" | "width"
> {
  alt?: string;
  countryCode: FlagCountryCode;
}

function Flag({ alt, className, countryCode, loading = "lazy", ...props }: FlagProps) {
  return (
    <Image
      alt={alt ?? flagCountryNames[countryCode]}
      className={cx("size-6 rounded-full object-cover", className)}
      decoding="async"
      height={24}
      loading={loading}
      src={`/images/flags/${countryCode}.webp`}
      width={24}
      {...props}
    />
  );
}

export { Flag };
