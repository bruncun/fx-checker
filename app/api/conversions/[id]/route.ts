import { deleteConversionAction } from "@/features/conversion-log/api/actions";
import { NextResponse, type NextRequest } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (id.length === 0 || id.length > 128) {
    return NextResponse.json({ error: "Invalid conversion id" }, { status: 400 });
  }

  await deleteConversionAction(id);

  return new NextResponse(null, { status: 204 });
}
