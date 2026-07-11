import {
  GUEST_ALERT_DISMISSED_COOKIE,
  isGuestCookieValue,
  isGuestModeFromCookies,
} from "@/features/guest-session/model/guest-session";
import { cookies } from "next/headers";
import { DismissibleGuestModeAlert } from "./guest-mode-alert-client";

export async function GuestModeAlert() {
  const cookieStore = await cookies();
  const isGuestMode = isGuestModeFromCookies(cookieStore);
  const isDismissed = isGuestCookieValue(cookieStore.get(GUEST_ALERT_DISMISSED_COOKIE)?.value);

  if (!isGuestMode || isDismissed) {
    return null;
  }

  return <DismissibleGuestModeAlert />;
}
