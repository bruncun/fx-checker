import { cn } from "@/lib/utils";
import { CardTitle } from "@/components/ui/card";
import Link from "next/link";

type ForgotPasswordSentProps = React.ComponentPropsWithoutRef<"div"> & {
  layout?: "modal" | "page";
};

export function ForgotPasswordSent({
  className,
  layout = "page",
  ...props
}: ForgotPasswordSentProps) {
  return (
    <div className={cn(layout === "modal" ? "mt-300" : "flex flex-col", className)} {...props}>
      {layout === "page" ? <CardTitle>Check Your Email</CardTitle> : null}
      <p className="text-preset-3-mobile text-center text-neutral-200">
        If you registered using your email and password, you will receive a password reset email.
      </p>
      {layout === "modal" ? (
        <p className="mt-250 w-full text-center text-preset-5-medium text-neutral-200">
          Ready to continue?{" "}
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
