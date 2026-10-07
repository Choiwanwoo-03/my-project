import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getPlayerLockState } from "@/lib/player-lock";

export async function POST(request: Request) {
  // 쓰기 API는 전부 같은 비밀번호로 잠근다. 재생 잠금을 풀지 않은 사람은 등록도 못 한다.
  if (getPlayerLockState() !== "unlocked") {
    return NextResponse.json({ error: "잠금을 먼저 해제해야 합니다." }, { status: 401 });
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
  const result = await db.collection("albums").insertOne({
    title,
    artist,
    releaseDate: releaseDate || "",
    rating: Number(rating),
    genre: genre || "",
    coverImageUrl: coverImageUrl || "",
    spotifyId: spotifyId || "",
    spotifyUrl: spotifyUrl || "",
  });

  return NextResponse.json({ id: result.insertedId }, { status: 201 });
}
