import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getAlbumById } from "@/lib/albums";
import { getPlayerLockState } from "@/lib/player-lock";
import { parseAlbumInput } from "@/lib/album-input";
import { getAlbumTracks, SpotifyTrack } from "@/lib/spotify";

// 상세 화면이 모달이라 서버 컴포넌트에서 직접 조회할 수 없어서, 클라이언트가 이 API로 받아 간다.
// 조회는 잠금 없이 누구나 할 수 있다 — 잠그는 건 쓰기(POST/PUT/DELETE)뿐이다.
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const album = await getAlbumById(params.id);
  if (!album) {
    return NextResponse.json({ error: "앨범을 찾을 수 없습니다." }, { status: 404 });
  }

  // Spotify 연결이 실패해도 앨범 정보는 보여야 하므로, 수록곡만 빈 배열로 둔다.
  let tracks: SpotifyTrack[] = [];
  if (album.spotifyId) {
    try {
      tracks = await getAlbumTracks(album.spotifyId);
    } catch (error) {
      console.error(error);
    }
  }

  return NextResponse.json({ album, tracks });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (getPlayerLockState() !== "unlocked") {
    return NextResponse.json({ error: "잠금을 먼저 해제해야 합니다." }, { status: 401 });
  }

  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "잘못된 id입니다." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const parsed = parseAlbumInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const db = await getDb();
  const result = await db
    .collection("albums")
    .updateOne({ _id: new ObjectId(params.id) }, { $set: parsed.data });

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "앨범을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (getPlayerLockState() !== "unlocked") {
    return NextResponse.json({ error: "잠금을 먼저 해제해야 합니다." }, { status: 401 });
  }

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
