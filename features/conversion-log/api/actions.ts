import {
  GUEST_MODE_COOKIE,
  isGuestCookieValue,
} from "@/features/guest-session/model/guest-session";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { Conversion, CreateConversionInput } from "../model/conversion-log";
import {
  createGuestConversionStore,
  createSupabaseConversionStore,
  type ConversionStore,
} from "../stores/store";

async function getAuthenticatedConversionStore(): Promise<ConversionStore> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("You must be signed in to manage conversions.");
  }

  return createSupabaseConversionStore({ supabase, userId: user.id });
}

async function getConversionStore(): Promise<ConversionStore> {
  const cookieStore = await cookies();

  return isGuestCookieValue(cookieStore.get(GUEST_MODE_COOKIE)?.value)
    ? createGuestConversionStore(cookieStore)
    : getAuthenticatedConversionStore();
}

export async function createConversionAction(input: CreateConversionInput): Promise<Conversion> {
  const store = await getConversionStore();

  return store.create(input);
}

export async function deleteConversionAction(id: string): Promise<void> {
  const store = await getConversionStore();

  await store.delete(id);
}

export async function deleteAllConversionsAction(): Promise<void> {
  const store = await getConversionStore();

  await store.deleteAll();
}
