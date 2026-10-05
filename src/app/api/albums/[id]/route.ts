import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "잘못된 id입니다." }, { status: 400 });
  }

  const body = await request.json();
  const { title, artist, releaseDate, rating, genre, coverImageUrl, spotifyId, spotifyUrl } = body;

  if (!title || !artist || !rating) {
    return NextResponse.json(
      { error: "앨범명, 아티스트, 평점은 필수입니다." },
      { status: 400 }
    );
  }

  const db = await getDb();
  const result = await db.collection("albums").updateOne(
    { _id: new ObjectId(params.id) },
    {
      $set: {
        title,
        artist,
        releaseDate: releaseDate || "",
        rating: Number(rating),
        genre: genre || "",
        coverImageUrl: coverImageUrl || "",
        spotifyId: spotifyId || "",
        spotifyUrl: spotifyUrl || "",
      },
    }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "앨범을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "잘못된 id입니다." }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.collection("albums").deleteOne({ _id: new ObjectId(params.id) });

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "앨범을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
