import { deleteConversionMutation } from "@/features/conversion-log/api/mutations";
import { CONVERSIONS_CACHE_TAG } from "@/features/conversion-log/api/tags";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (id.length === 0 || id.length > 128) {
    return NextResponse.json({ error: "Invalid conversion id" }, { status: 400 });
  }

  await deleteConversionMutation(id);
  revalidateTag(CONVERSIONS_CACHE_TAG, { expire: 0 });

  return new NextResponse(null, { status: 204 });
}
