import { cn } from "@/lib/utils";

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
      role="status"
    >
      <span
        aria-hidden="true"
        className="mx-auto block size-500 rounded-full border border-neutral-600 border-t-neutral-300 motion-safe:animate-spin"
      />
    </div>
  );
}

export { TabPendingState };
