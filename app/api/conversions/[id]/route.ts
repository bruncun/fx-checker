import { deleteConversionAction } from "@/features/conversion-log/actions";
import { NextResponse, type NextRequest } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await deleteConversionAction(id);

  return new NextResponse(null, { status: 204 });
}
