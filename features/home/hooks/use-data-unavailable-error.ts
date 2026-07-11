"use client";

import * as React from "react";

import { throwDataUnavailable } from "../components/data-unavailable";

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
