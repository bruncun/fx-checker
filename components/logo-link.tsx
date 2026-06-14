/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

export function LogoLink() {
  return (
    <Link href="/" aria-label="FX Checker">
      <img src="/images/logo.svg" alt="" className="h-250 sm:h-[26px]" />
    </Link>
  );
}
