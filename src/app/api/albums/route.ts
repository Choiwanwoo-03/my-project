import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(request: Request) {
  const body = await request.json();
  const { title, artist, releaseDate, rating, genre, coverImageUrl } = body;

  if (!title || !artist || !rating) {
    return NextResponse.json(
      { error: "앨범명, 아티스트, 평점은 필수입니다." },
      { status: 400 }
    );
  }

  const db = await getDb();
  const result = await db.collection("albums").insertOne({
    title,
    artist,
    releaseDate: releaseDate || "",
    rating: Number(rating),
    genre: genre || "",
    coverImageUrl: coverImageUrl || "",
  });

  return NextResponse.json({ id: result.insertedId }, { status: 201 });
}
