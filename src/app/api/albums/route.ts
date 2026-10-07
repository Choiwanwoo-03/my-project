import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getPlayerLockState } from "@/lib/player-lock";
import { SPOTIFY_ID_PATTERN, spotifyAlbumUrl } from "@/lib/spotify";

export async function POST(request: Request) {
  // 쓰기 API는 전부 같은 비밀번호로 잠근다. 재생 잠금을 풀지 않은 사람은 등록도 못 한다.
  if (getPlayerLockState() !== "unlocked") {
    return NextResponse.json({ error: "잠금을 먼저 해제해야 합니다." }, { status: 401 });
  }

  const body = await request.json();
  const { title, artist, releaseDate, rating, genre, coverImageUrl, spotifyId } = body;

  if (!title || !artist || !rating) {
    return NextResponse.json(
      { error: "앨범명, 아티스트, 평점은 필수입니다." },
      { status: 400 }
    );
  }

  if (coverImageUrl && (typeof coverImageUrl !== "string" || !coverImageUrl.startsWith("https://"))) {
    return NextResponse.json({ error: "잘못된 이미지 주소입니다." }, { status: 400 });
  }

  // spotifyId만 저장하고, Spotify 주소는 항상 서버가 이 값으로 직접 만든다.
  // 클라이언트가 보낸 spotifyUrl 문자열은 그대로 믿지 않는다.
  const validSpotifyId = typeof spotifyId === "string" && SPOTIFY_ID_PATTERN.test(spotifyId);

  const db = await getDb();
  const result = await db.collection("albums").insertOne({
    title,
    artist,
    releaseDate: releaseDate || "",
    rating: Number(rating),
    genre: genre || "",
    coverImageUrl: coverImageUrl || "",
    spotifyId: validSpotifyId ? spotifyId : "",
    spotifyUrl: validSpotifyId ? spotifyAlbumUrl(spotifyId) : "",
  });

  return NextResponse.json({ id: result.insertedId }, { status: 201 });
}
