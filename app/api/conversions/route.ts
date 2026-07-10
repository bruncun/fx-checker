import {
  createConversionAction,
  deleteAllConversionsAction,
} from "@/features/conversion-log/actions";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const conversion = await createConversionAction(await request.json());

  return NextResponse.json(conversion);
}

export async function DELETE() {
  await deleteAllConversionsAction();

  return new NextResponse(null, { status: 204 });
}
