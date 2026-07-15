type StaleExchangeRatesAlertProps = {
  fetchedAt: string;
};

const fetchedAtFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

function formatFetchedAt(fetchedAt: string) {
  const date = new Date(fetchedAt);

  if (Number.isNaN(date.getTime())) {
    return fetchedAt;
  }

  return fetchedAtFormatter.format(date);
}

export function StaleExchangeRatesAlert({ fetchedAt }: StaleExchangeRatesAlertProps) {
  return (
    <div
      aria-describedby="stale-exchange-rates-alert-description"
      aria-labelledby="stale-exchange-rates-alert-title"
      className="mb-250 rounded-8 bg-neutral-600 p-200 shadow-[inset_0_0_0_1px_hsl(var(--lime-500))]"
      role="alert"
    >
      <h2 id="stale-exchange-rates-alert-title" className="text-preset-4 text-neutral-50 uppercase">
        Exchange rates could not be updated
      </h2>
      <p
        id="stale-exchange-rates-alert-description"
        className="mt-075 text-preset-5 text-neutral-100"
      >
        You&apos;re viewing data last refreshed on {formatFetchedAt(fetchedAt)}.
      </p>
    </div>
  );
}
