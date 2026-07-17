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

async function getConversionMutationStore(): Promise<ConversionStore> {
  const cookieStore = await cookies();

  return isGuestCookieValue(cookieStore.get(GUEST_MODE_COOKIE)?.value)
    ? createGuestConversionStore(cookieStore)
    : getAuthenticatedConversionStore();
}

export async function createConversionMutation(input: CreateConversionInput): Promise<Conversion> {
  const store = await getConversionMutationStore();

  return store.create(input);
}

export async function deleteConversionMutation(id: string): Promise<void> {
  const store = await getConversionMutationStore();

  await store.delete(id);
}

export async function deleteAllConversionsMutation(): Promise<void> {
  const store = await getConversionMutationStore();

  await store.deleteAll();
}
