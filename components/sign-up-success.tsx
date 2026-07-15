import { cn } from "@/lib/utils";
import { CardTitle } from "@/components/ui/card";
import Link from "next/link";

type SignUpSuccessProps = React.ComponentPropsWithoutRef<"div"> & {
  layout?: "modal" | "page";
};

export function SignUpSuccess({ className, layout = "page", ...props }: SignUpSuccessProps) {
  return (
    <div className={cn(layout === "modal" ? "mt-300" : "flex flex-col", className)} {...props}>
      {layout === "page" ? <CardTitle>Thank you for signing up!</CardTitle> : null}
      <p className="text-preset-3-mobile text-center text-neutral-200">
        You&apos;ve successfully signed up. Please check your email to confirm your account before
        signing in.
      </p>
      {layout === "modal" ? (
        <p className="mt-250 w-full text-center text-preset-5-medium text-neutral-200">
          Already confirmed?{" "}
          <Link
            href="/auth/login"
            replace
            className="rounded-4 text-neutral-50 underline underline-offset-4 hover:decoration-neutral-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-lime-500"
          >
            Login
          </Link>
        </p>
      ) : null}
    </div>
  );
}
