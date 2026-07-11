import "server-only";

import {
  addGuestConversion,
  GUEST_CONVERSIONS_COOKIE,
  readGuestConversionsCookie,
  serializeGuestConversionsCookie,
  trimGuestConversions,
} from "@/features/guest-session/guest-session";
import { createClient } from "@/lib/supabase/server";
import {
  mapConversion,
  normalizeConversionInput,
  type Conversion,
  type CreateConversionInput,
} from "./conversion-log";

const CONVERSION_SELECT = "id, from_currency, to_currency, send_amount, receive_amount, created_at";

type CookieStore = {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options?: { path?: string; sameSite?: "lax" }): void;
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type ConversionStore = {
  create(input: CreateConversionInput): Promise<Conversion>;
  delete(id: string): Promise<void>;
  deleteAll(): Promise<void>;
  list(): Promise<Conversion[]>;
};

export function createGuestConversionStore(cookieStore: CookieStore): ConversionStore {
  return {
    async create(input) {
      const conversions = readGuestConversionsCookie(
        cookieStore.get(GUEST_CONVERSIONS_COOKIE)?.value
      );
      const conversion = addGuestConversion(input);

      cookieStore.set(
        GUEST_CONVERSIONS_COOKIE,
        serializeGuestConversionsCookie(trimGuestConversions([conversion, ...conversions])),
        { path: "/", sameSite: "lax" }
      );

      return conversion;
    },
    async delete(id) {
      const conversions = readGuestConversionsCookie(
        cookieStore.get(GUEST_CONVERSIONS_COOKIE)?.value
      );

      cookieStore.set(
        GUEST_CONVERSIONS_COOKIE,
        serializeGuestConversionsCookie(conversions.filter((conversion) => conversion.id !== id)),
        { path: "/", sameSite: "lax" }
      );
    },
    async deleteAll() {
      cookieStore.set(GUEST_CONVERSIONS_COOKIE, serializeGuestConversionsCookie([]), {
        path: "/",
        sameSite: "lax",
      });
    },
    async list() {
      return readGuestConversionsCookie(cookieStore.get(GUEST_CONVERSIONS_COOKIE)?.value);
    },
  };
}

export function createSupabaseConversionStore({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId?: string;
}): ConversionStore {
  return {
    async create(input) {
      if (!userId) {
        throw new Error("You must be signed in to manage conversions.");
      }

      const normalizedInput = normalizeConversionInput(input);
      const { data, error } = await supabase
        .from("conversions")
        .insert({
          from_currency: normalizedInput.fromCurrency,
          receive_amount: normalizedInput.receiveAmount,
          send_amount: normalizedInput.sendAmount,
          to_currency: normalizedInput.toCurrency,
          user_id: userId,
        })
        .select(CONVERSION_SELECT)
        .single();

      if (error) {
        throw error;
      }

      return mapConversion(data);
    },
    async delete(id) {
      if (!userId) {
        throw new Error("You must be signed in to manage conversions.");
      }

      const { error } = await supabase
        .from("conversions")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        throw error;
      }
    },
    async deleteAll() {
      if (!userId) {
        throw new Error("You must be signed in to manage conversions.");
      }

      const { error } = await supabase.from("conversions").delete().eq("user_id", userId);

      if (error) {
        throw error;
      }
    },
    async list() {
      const { data, error } = await supabase
        .from("conversions")
        .select(CONVERSION_SELECT)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapConversion);
    },
  };
}
