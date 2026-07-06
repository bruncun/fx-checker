import { TabEmptyState } from "@/components/ui/tab-empty-state";

type DataResult = { status: "available" } | { status: "unavailable" };

const DATA_UNAVAILABLE_ERROR_MESSAGE = "Something went wrong";

function DataUnavailable() {
  return (
    <main className="text-white min-h-screen bg-neutral-900">
      <DataUnavailableContent />
    </main>
  );
}

function DataUnavailableContent() {
  return (
    <section className="mx-auto flex min-h-screen max-w-[520px] items-center justify-center px-300">
      <TabEmptyState
        title="Something went wrong"
        lead={
          <>
            FX Checker hit an unexpected error right now.
            <br />
            Please refresh the page in a moment.
          </>
        }
      />
    </section>
  );
}

function throwDataUnavailable(): never {
  throw new Error(DATA_UNAVAILABLE_ERROR_MESSAGE);
}

function assertDataAvailable<T extends DataResult>(
  data: T
): asserts data is Extract<T, { status: "available" }> {
  if (data.status === "unavailable") {
    throwDataUnavailable();
  }
}

export { assertDataAvailable, DataUnavailable, DataUnavailableContent, throwDataUnavailable };
