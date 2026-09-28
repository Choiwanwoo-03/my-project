import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { AlbumStatus } from "@/types/album";

export async function POST(request: Request) {
  const body = await request.json();
  const { title, artist, releaseDate, rating, status, genre } = body;

  if (!title || !artist || !rating || !status) {
    return NextResponse.json(
      { error: "앨범명, 아티스트, 평점, 상태는 필수입니다." },
      { status: 400 }
    );
  }

  const db = await getDb();
  const result = await db.collection("albums").insertOne({
    title,
    artist,
    releaseDate: releaseDate || "",
    rating: Number(rating),
    status: status as AlbumStatus,
    genre: genre || "",
  });

  return NextResponse.json({ id: result.insertedId }, { status: 201 });
}
