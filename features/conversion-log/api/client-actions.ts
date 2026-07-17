import type { Conversion, CreateConversionInput } from "../model/conversion-log";

export async function createConversion(input: CreateConversionInput): Promise<Conversion> {
  const { createConversionAction } = await import("./actions");

  return createConversionAction(input);
}

export async function deleteConversion(id: string): Promise<void> {
  const { deleteConversionAction } = await import("./actions");

  return deleteConversionAction(id);
}

export async function deleteAllConversions(): Promise<void> {
  const { deleteAllConversionsAction } = await import("./actions");

  return deleteAllConversionsAction();
}
