import { createFavoriteMutation, deleteFavoriteMutation } from "@/features/favorites/api/mutations";
import { FAVORITES_CACHE_TAG } from "@/features/favorites/api/tags";
import { InvalidFavoritePairError, parseFavoritePair } from "@/features/favorites/model/favorites";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

async function readFavoritePair(request: NextRequest) {
  try {
    return parseFavoritePair(await request.json());
  } catch (error) {
    if (error instanceof InvalidFavoritePairError || error instanceof SyntaxError) {
      return null;
    }

    throw error;
  }
}

export async function POST(request: NextRequest) {
  const pair = await readFavoritePair(request);

  if (!pair) {
    return NextResponse.json({ error: "Invalid favorite currency pair" }, { status: 400 });
  }

  const favorite = await createFavoriteMutation(pair);

  revalidateTag(FAVORITES_CACHE_TAG, { expire: 0 });

  return NextResponse.json(favorite);
}

export async function DELETE(request: NextRequest) {
  const pair = await readFavoritePair(request);

  if (!pair) {
    return NextResponse.json({ error: "Invalid favorite currency pair" }, { status: 400 });
  }

  await deleteFavoriteMutation(pair);
  revalidateTag(FAVORITES_CACHE_TAG, { expire: 0 });

  return new NextResponse(null, { status: 204 });
}
