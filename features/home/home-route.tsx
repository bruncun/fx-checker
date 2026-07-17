import { assertDataAvailable } from "@/features/home/components/data-unavailable";
import {
  createUrlSearchParams,
  getFxUrlStateFromParams,
  type FxUrlState,
} from "@/features/home/utils/url-state";
import {
  RateHistoryChartPanel,
  RateHistoryEmptyState,
  RateHistoryStats,
} from "@/features/rate-history/components/rate-history";
import { deriveRateHistoryData } from "@/features/rate-history/model/rate-history";
import type { RateHistoryRangeModel } from "@/features/rate-history/model/rate-history";
import { deriveRateHistoryRangeViewModel } from "@/features/rate-history/model/rate-history-chart-model";
import { RateHistoryRangePicker } from "@/features/rate-history/components/rate-history-range-viewer";
import { getHistoryPageData, type HistoryPageData } from "@/features/rate-history/api/server";
import {
  ChartFallback,
  RateHistoryFallback,
  RateHistoryStatsFallback,
} from "@/features/rate-details/components/rate-details-fallback";
import { Suspense } from "react";
import { HomePageRouteContent, type HomePageSearchParams } from "./home-page";

export type HomeRouteProps = {
  searchParams: HomePageSearchParams;
};

type RateHistoryContentProps = {
  historyPageData: Promise<HistoryPageData>;
  receiveCurrencyCode: string;
  selectedPair: string;
  selectedRange: FxUrlState["selectedRange"];
  sendCurrencyCode: string;
};

type RateHistoryPanelData = {
  panel: RateHistoryRangeModel | null;
  pair: string;
};

async function getRateHistoryPanelData({
  historyPageData,
  receiveCurrencyCode,
  selectedPair,
  selectedRange,
  sendCurrencyCode,
}: RateHistoryContentProps): Promise<RateHistoryPanelData> {
  const data = await historyPageData;

  assertDataAvailable(data);

  const history = deriveRateHistoryData({
    baseCurrency: sendCurrencyCode,
    quoteCurrency: receiveCurrencyCode,
    rates: data.historicalRates,
  });
  const model = deriveRateHistoryRangeViewModel(history, selectedRange);
  const selectedPanel =
    model?.ranges.find((panel) => panel.range === selectedRange) ?? model?.ranges[0] ?? null;

  return {
    pair: model?.pair ?? selectedPair,
    panel: selectedPanel,
  };
}

async function RateHistoryStatsContent(props: RateHistoryContentProps) {
  const { panel } = await getRateHistoryPanelData(props);

  return panel ? <RateHistoryStats panel={panel} /> : null;
}

async function RateHistoryChartContent(props: RateHistoryContentProps) {
  const { pair, panel } = await getRateHistoryPanelData(props);

  return panel ? (
    <RateHistoryChartPanel panel={panel} pair={pair} />
  ) : (
    <RateHistoryEmptyState pair={pair} />
  );
}

async function HomeRouteContent({ searchParams }: HomeRouteProps) {
  const { receiveCurrencyCode, routeKey, selectedPair, selectedRange, sendCurrencyCode } =
    getFxUrlStateFromParams(createUrlSearchParams(await searchParams));
  const historyPageData = getHistoryPageData({
    baseCurrency: sendCurrencyCode,
    quoteCurrency: receiveCurrencyCode,
    range: selectedRange,
  });

  return (
    <div className="uppercase">
      <div
        className="lg:flex lg:items-center lg:justify-between lg:gap-400"
        role="group"
        aria-label="Header"
      >
        <Suspense fallback={<RateHistoryStatsFallback />} key={`stats:${routeKey}`}>
          <RateHistoryStatsContent
            historyPageData={historyPageData}
            receiveCurrencyCode={receiveCurrencyCode}
            selectedPair={selectedPair}
            selectedRange={selectedRange}
            sendCurrencyCode={sendCurrencyCode}
          />
        </Suspense>
        <RateHistoryRangePicker selectedRange={selectedRange} />
      </div>
      <Suspense fallback={<ChartFallback />} key={`chart:${routeKey}`}>
        <RateHistoryChartContent
          historyPageData={historyPageData}
          receiveCurrencyCode={receiveCurrencyCode}
          selectedPair={selectedPair}
          selectedRange={selectedRange}
          sendCurrencyCode={sendCurrencyCode}
        />
      </Suspense>
    </div>
  );
}

export function HomeRoute({ searchParams }: HomeRouteProps) {
  return (
    <HomePageRouteContent searchParams={searchParams}>
      <Suspense fallback={<RateHistoryFallback />}>
        <HomeRouteContent searchParams={searchParams} />
      </Suspense>
    </HomePageRouteContent>
  );
}
