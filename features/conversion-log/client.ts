import {
  createGuestConversion,
  deleteAllGuestConversions,
  deleteGuestConversion,
  isGuestMode,
} from "@/features/guest-session/client";
import {
  normalizeConversionInput,
  type Conversion,
  type CreateConversionInput,
} from "./conversion-log";

export async function createConversion(input: CreateConversionInput): Promise<Conversion> {
  if (isGuestMode()) {
    return createGuestConversion(input);
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
    deleteGuestConversion(id);

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
    deleteAllGuestConversions();

    return;
  }

  const response = await fetch("/api/conversions", {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to clear conversions.");
  }
}
