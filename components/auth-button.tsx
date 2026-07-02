import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { cn } from "@/lib/utils";

export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return user ? (
    <div className="gap-4 flex items-center">
      Hey, {user.email}!
      <LogoutButton />
    </div>
  ) : (
    <div className="gap-2 flex">
      <Link className={cn(buttonVariants({ size: "sm", variant: "outline" }))} href="/auth/login">
        Sign in
      </Link>
      <Link className={cn(buttonVariants({ size: "sm", variant: "default" }))} href="/auth/sign-up">
        Sign up
      </Link>
    </div>
  );
}
