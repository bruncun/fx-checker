import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";
import { FetchDataSteps } from "@/components/tutorial/fetch-data-steps";
import { Suspense } from "react";

async function UserDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return JSON.stringify(data.claims, null, 2);
}

export default function ProtectedPage() {
  return (
    <div className="gap-12 flex w-full flex-1 flex-col">
      <div className="w-full">
        <div className="text-sm p-3 px-5 rounded-md gap-3 flex items-center bg-accent text-foreground">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated user
        </div>
      </div>
      <div className="gap-2 flex flex-col items-start">
        <h2 className="text-2xl mb-4 font-bold">Your user details</h2>
        <pre className="text-xs p-3 rounded max-h-32 overflow-auto border font-mono">
          <Suspense>
            <UserDetails />
          </Suspense>
        </pre>
      </div>
      <div>
        <h2 className="text-2xl mb-4 font-bold">Next steps</h2>
        <FetchDataSteps />
      </div>
    </div>
  );
}
