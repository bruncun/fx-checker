import {
  createConversionMutation,
  deleteAllConversionsMutation,
} from "@/features/conversion-log/api/mutations";
import { CONVERSIONS_CACHE_TAG } from "@/features/conversion-log/api/tags";
import {
  InvalidConversionInputError,
  parseCreateConversionInput,
} from "@/features/conversion-log/model/conversion-log";
import { revalidateTag } from "next/cache";
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

  const conversion = await createConversionMutation(input);

  revalidateTag(CONVERSIONS_CACHE_TAG, { expire: 0 });

  return NextResponse.json(conversion);
}

export async function DELETE() {
  await deleteAllConversionsMutation();
  revalidateTag(CONVERSIONS_CACHE_TAG, { expire: 0 });

  return new NextResponse(null, { status: 204 });
}
