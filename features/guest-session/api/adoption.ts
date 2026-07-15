import "server-only";

import type { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import {
  GUEST_ALERT_DISMISSED_COOKIE,
  GUEST_CONVERSIONS_COOKIE,
  GUEST_FAVORITES_COOKIE,
  GUEST_MODE_COOKIE,
  isGuestModeFromCookies,
  readGuestConversionsCookie,
  readGuestFavoritesCookie,
} from "../model/guest-session";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const guestSessionCookies = [
  GUEST_MODE_COOKIE,
  GUEST_FAVORITES_COOKIE,
  GUEST_CONVERSIONS_COOKIE,
  GUEST_ALERT_DISMISSED_COOKIE,
];

async function clearGuestSessionCookies() {
  const cookieStore = await cookies();

  guestSessionCookies.forEach((name) => {
    cookieStore.set(name, "", {
      maxAge: 0,
      path: "/",
      sameSite: "lax",
    });
  });
}

export async function adoptGuestSessionData({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}) {
  const cookieStore = await cookies();

  if (!isGuestModeFromCookies(cookieStore)) {
    return;
  }

  const favorites = readGuestFavoritesCookie(cookieStore.get(GUEST_FAVORITES_COOKIE)?.value);
  const conversions = readGuestConversionsCookie(cookieStore.get(GUEST_CONVERSIONS_COOKIE)?.value);

  if (favorites.length > 0) {
    const { error } = await supabase.from("favorites").upsert(
      favorites.map((favorite) => ({
        created_at: favorite.createdAt,
        from_currency: favorite.fromCurrency,
        to_currency: favorite.toCurrency,
        user_id: userId,
      })),
      {
        ignoreDuplicates: true,
        onConflict: "user_id,from_currency,to_currency",
      }
    );

    if (error) {
      throw error;
    }
  }

  if (conversions.length > 0) {
    const { error } = await supabase.from("conversions").insert(
      conversions.map((conversion) => ({
        created_at: conversion.createdAt,
        from_currency: conversion.fromCurrency,
        receive_amount: conversion.receiveAmount,
        send_amount: conversion.sendAmount,
        to_currency: conversion.toCurrency,
        user_id: userId,
      }))
    );

    if (error) {
      throw error;
    }
  }

  await clearGuestSessionCookies();
}
