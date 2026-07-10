import { createFavorite, deleteFavorite } from "@/features/favorites/actions";
import { InvalidFavoritePairError, parseFavoritePair } from "@/features/favorites/favorites";
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

  const favorite = await createFavorite(pair);

  return NextResponse.json(favorite);
}

export async function DELETE(request: NextRequest) {
  const pair = await readFavoritePair(request);

  if (!pair) {
    return NextResponse.json({ error: "Invalid favorite currency pair" }, { status: 400 });
  }

  await deleteFavorite(pair);

  return new NextResponse(null, { status: 204 });
}
