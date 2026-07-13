import { cn } from "@/lib/utils";
import { PendingSpinner } from "./pending-spinner";

type TabPendingStateProps = {
  className?: string;
  label: string;
};

function TabPendingState({ className, label }: TabPendingStateProps) {
  return (
    <div
      aria-label={label}
      aria-live="polite"
      className={cn("py-600 text-center", className)}
      data-tab-pending-state
      role="status"
    >
      <PendingSpinner aria-hidden="true" className="mx-auto" />
    </div>
  );
}

export { TabPendingState };
