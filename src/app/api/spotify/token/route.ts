import { NextResponse } from "next/server";
import { getUserAccessToken } from "@/lib/spotify-auth";
import { getPlayerLockState } from "@/lib/player-lock";

export const dynamic = "force-dynamic";

export async function GET() {
  const lock = getPlayerLockState();
  if (lock === "misconfigured") {
    return NextResponse.json(
      { error: "PLAYER_PASSWORD 환경변수가 설정되지 않았습니다." },
      { status: 500 }
    );
  }
  if (lock === "locked") {
    return NextResponse.json({ error: "재생하려면 비밀번호가 필요합니다." }, { status: 401 });
  }

  try {
    const accessToken = await getUserAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: "Spotify 계정이 연결되지 않았습니다." }, { status: 404 });
    }
    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Spotify 토큰을 받지 못했습니다." }, { status: 502 });
  }
}
