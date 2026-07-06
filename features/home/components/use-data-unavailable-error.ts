"use client";

import * as React from "react";

import { throwDataUnavailable } from "./data-unavailable";

function useDataUnavailableError() {
  const [shouldThrow, setShouldThrow] = React.useState(false);

  if (shouldThrow) {
    throwDataUnavailable();
  }

  return React.useCallback(() => {
    setShouldThrow(true);
  }, []);
}

export { useDataUnavailableError };
