import {
  addGuestConversion,
  GUEST_CONVERSIONS_COOKIE,
  GUEST_MODE_COOKIE,
  readGuestConversionsCookie,
  serializeGuestConversionsCookie,
  trimGuestConversions,
} from "@/features/guest-session/guest-session";
import {
  normalizeConversionInput,
  type Conversion,
  type CreateConversionInput,
} from "./conversion-log";

function getCookieValue(name: string) {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function setSessionCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; Path=/; SameSite=Lax`;
}

function isGuestMode() {
  return getCookieValue(GUEST_MODE_COOKIE) === "1";
}

export async function createConversion(input: CreateConversionInput): Promise<Conversion> {
  if (isGuestMode()) {
    const conversions = readGuestConversionsCookie(getCookieValue(GUEST_CONVERSIONS_COOKIE));
    const conversion = addGuestConversion(input);

    setSessionCookie(
      GUEST_CONVERSIONS_COOKIE,
      serializeGuestConversionsCookie(trimGuestConversions([conversion, ...conversions]))
    );

    return conversion;
  }

  const response = await fetch("/api/conversions", {
    body: JSON.stringify(normalizeConversionInput(input)),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to log conversion.");
  }

  return (await response.json()) as Conversion;
}

export async function deleteConversion(id: string): Promise<void> {
  if (isGuestMode()) {
    const conversions = readGuestConversionsCookie(getCookieValue(GUEST_CONVERSIONS_COOKIE));

    setSessionCookie(
      GUEST_CONVERSIONS_COOKIE,
      serializeGuestConversionsCookie(conversions.filter((conversion) => conversion.id !== id))
    );

    return;
  }

  const response = await fetch(`/api/conversions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete conversion.");
  }
}

export async function deleteAllConversions(): Promise<void> {
  if (isGuestMode()) {
    setSessionCookie(GUEST_CONVERSIONS_COOKIE, serializeGuestConversionsCookie([]));

    return;
  }

  const response = await fetch("/api/conversions", {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to clear conversions.");
  }
}
