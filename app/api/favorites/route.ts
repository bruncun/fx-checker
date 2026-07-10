import { createFavorite, deleteFavorite } from "@/features/favorites/actions";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const favorite = await createFavorite(await request.json());

  return NextResponse.json(favorite);
}

export async function DELETE(request: NextRequest) {
  await deleteFavorite(await request.json());

  return new NextResponse(null, { status: 204 });
}
