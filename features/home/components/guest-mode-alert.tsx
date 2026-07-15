import {
  GUEST_ALERT_DISMISSED_COOKIE,
  GUEST_CONVERSIONS_COOKIE,
  GUEST_FAVORITES_COOKIE,
  isGuestCookieValue,
  isGuestModeFromCookies,
  readGuestConversionsCookie,
  readGuestFavoritesCookie,
} from "@/features/guest-session/model/guest-session";
import { cookies } from "next/headers";
import { DismissibleGuestPersistenceAlert } from "./guest-mode-alert-client";

export async function GuestModeAlert() {
  const cookieStore = await cookies();
  const isGuestMode = isGuestModeFromCookies(cookieStore);
  const isDismissed = isGuestCookieValue(cookieStore.get(GUEST_ALERT_DISMISSED_COOKIE)?.value);
  const hasSavedGuestData =
    readGuestFavoritesCookie(cookieStore.get(GUEST_FAVORITES_COOKIE)?.value).length > 0 ||
    readGuestConversionsCookie(cookieStore.get(GUEST_CONVERSIONS_COOKIE)?.value).length > 0;

  if (!isGuestMode || isDismissed || !hasSavedGuestData) {
    return null;
  }

  return <DismissibleGuestPersistenceAlert />;
}
