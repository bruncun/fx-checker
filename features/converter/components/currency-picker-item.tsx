import { Flag } from "@/components/ui/flag";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { CurrencyPickerItem } from "../model/currency-groups";

type CurrencyItemProps = {
  currency: CurrencyPickerItem;
  isActive: boolean;
  isSelected: boolean;
  onSelect: (currency: CurrencyPickerItem) => void;
};

function CurrencyItem({ currency, isActive, isSelected, onSelect }: CurrencyItemProps) {
  return (
    <li className="px-100">
      <button
        aria-current={isSelected ? "true" : undefined}
        aria-label={`${currency.code}, ${currency.name}`}
        className={cn(
          "fx-transition-surface flex w-full cursor-pointer items-center gap-150 rounded-4 border-y border-transparent p-150 py-150 text-left text-neutral-50",
          "hover:shadow-[inset_0_0_0_1px_hsl(var(--neutral-200))] focus:shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] focus:outline-none"
        )}
        data-currency-code={currency.code}
        data-currency-option
        onClick={() => {
          onSelect(currency);
        }}
        tabIndex={isActive ? 0 : -1}
        type="button"
      >
        <Flag className="size-250" countryCode={currency.countryCode} alt="" />
        <span className="flex min-w-0 flex-1 items-baseline gap-150">
          <span className="text-preset-4">{currency.code}</span>
          <span className="truncate text-preset-5 text-neutral-200">{currency.name}</span>
        </span>
        {isSelected ? <Icon className="mr-050 size-150" decorative iconName="check" /> : null}
      </button>
    </li>
  );
}

export { CurrencyItem };
