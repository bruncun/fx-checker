"use client";

import * as React from "react";
import type { Conversion, CreateConversionInput } from "../model/conversion-log";
import { createConversion, deleteAllConversions, deleteConversion } from "../api/client-actions";

type ConversionMutations = {
  createConversion: (input: CreateConversionInput) => Promise<Conversion>;
  deleteAllConversions: () => Promise<void>;
  deleteConversion: (id: string) => Promise<void>;
};

export function useConversionMutations(): ConversionMutations {
  return React.useMemo(
    () => ({
      createConversion,
      deleteAllConversions,
      deleteConversion,
    }),
    []
  );
}
