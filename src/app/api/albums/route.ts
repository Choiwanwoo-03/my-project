import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getPlayerLockState } from "@/lib/player-lock";
import { parseAlbumInput } from "@/lib/album-input";

export async function POST(request: Request) {
  // 쓰기 API는 전부 같은 비밀번호로 잠근다. 재생 잠금을 풀지 않은 사람은 등록도 못 한다.
  if (getPlayerLockState() !== "unlocked") {
    return NextResponse.json({ error: "잠금을 먼저 해제해야 합니다." }, { status: 401 });
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
  const result = await db.collection("albums").insertOne(parsed.data);

  return NextResponse.json({ id: result.insertedId }, { status: 201 });
}
