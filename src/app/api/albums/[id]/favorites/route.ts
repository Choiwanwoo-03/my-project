import { NextResponse } from "next/server";
import { ObjectId, UpdateFilter } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getPlayerLockState } from "@/lib/player-lock";
import { SPOTIFY_ID_PATTERN } from "@/lib/spotify";

type FavoritesDoc = { favoriteTrackIds: string[] };

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (getPlayerLockState() !== "unlocked") {
    return NextResponse.json({ error: "잠금을 먼저 해제해야 합니다." }, { status: 401 });
  }

  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "잘못된 id입니다." }, { status: 400 });
  }

  const { trackId, favorite } = await request.json();
  if (
    typeof trackId !== "string" ||
    !SPOTIFY_ID_PATTERN.test(trackId) ||
    typeof favorite !== "boolean"
  ) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const db = await getDb();
  // $addToSet은 이미 있는 곡을 또 넣지 않고, $pull은 목록에서 그 곡을 뺀다.
  const update: UpdateFilter<FavoritesDoc> = favorite
    ? { $addToSet: { favoriteTrackIds: trackId } }
    : { $pull: { favoriteTrackIds: trackId } };
  const result = await db
    .collection<FavoritesDoc>("albums")
    .updateOne({ _id: new ObjectId(params.id) }, update);

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "앨범을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
