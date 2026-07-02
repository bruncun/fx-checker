import { AuthShell } from "@/components/auth-shell";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

async function ErrorContent({ searchParams }: { searchParams: Promise<{ error: string }> }) {
  const params = await searchParams;

  return (
    <>
      {params?.error ? (
        <p className="text-center text-preset-4 text-neutral-200">Code error: {params.error}</p>
      ) : (
        <p className="text-center text-preset-4 text-neutral-200">An unspecified error occurred.</p>
      )}
    </>
  );
}

export default function Page({ searchParams }: { searchParams: Promise<{ error: string }> }) {
  return (
    <AuthShell>
      <div className="flex flex-col">
        <CardTitle>Sorry, something went wrong.</CardTitle>
        <Card>
          <CardContent>
            <Suspense>
              <ErrorContent searchParams={searchParams} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </AuthShell>
  );
}
