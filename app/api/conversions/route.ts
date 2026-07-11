import {
  createConversionAction,
  deleteAllConversionsAction,
} from "@/features/conversion-log/api/actions";
import {
  InvalidConversionInputError,
  parseCreateConversionInput,
} from "@/features/conversion-log/model/conversion-log";
import { NextResponse, type NextRequest } from "next/server";

async function readConversionInput(request: NextRequest) {
  try {
    return parseCreateConversionInput(await request.json());
  } catch (error) {
    if (error instanceof InvalidConversionInputError || error instanceof SyntaxError) {
      return null;
    }

    throw error;
  }
}

export async function POST(request: NextRequest) {
  const input = await readConversionInput(request);

  if (!input) {
    return NextResponse.json({ error: "Invalid conversion" }, { status: 400 });
  }

  const conversion = await createConversionAction(input);

  return NextResponse.json(conversion);
}

export async function DELETE() {
  await deleteAllConversionsAction();

  return new NextResponse(null, { status: 204 });
}
