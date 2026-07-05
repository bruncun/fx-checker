import { warmFrankfurterCache } from "@/features/home/cache-warmup";

function getCronSecret() {
  return process.env.CRON_SECRET?.trim();
}

function isAuthorized(request: Request) {
  const cronSecret = getCronSecret();

  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await warmFrankfurterCache();

  return Response.json(result, { status: result.ok ? 200 : 502 });
}
