"use server";

import { updateTag } from "next/cache";
import type { Conversion, CreateConversionInput } from "../model/conversion-log";
import { parseCreateConversionInput } from "../model/conversion-log";
import {
  createConversionMutation,
  deleteAllConversionsMutation,
  deleteConversionMutation,
} from "./mutations";
import { CONVERSIONS_CACHE_TAG } from "./tags";

export async function createConversionAction(input: CreateConversionInput): Promise<Conversion> {
  const conversion = await createConversionMutation(parseCreateConversionInput(input));

  updateTag(CONVERSIONS_CACHE_TAG);

  return conversion;
}

export async function deleteConversionAction(id: string): Promise<void> {
  await deleteConversionMutation(id);
  updateTag(CONVERSIONS_CACHE_TAG);
}

export async function deleteAllConversionsAction(): Promise<void> {
  await deleteAllConversionsMutation();
  updateTag(CONVERSIONS_CACHE_TAG);
}
