import { NextResponse } from "next/server";
import { SPOTIFY_SCOPES } from "@/lib/spotify-auth";
import { getPlayerLockState } from "@/lib/player-lock";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUriEnv = process.env.SPOTIFY_REDIRECT_URI;
  if (!clientId || !redirectUriEnv) {
    return NextResponse.json(
      { error: "SPOTIFY_CLIENT_ID / SPOTIFY_REDIRECT_URI 환경변수가 없습니다." },
      { status: 500 }
    );
  }

  // 확인용 쿠키는 접속한 주소에만 저장되므로, 돌아올 주소(redirect URI)와 같은 주소에서 시작하게 한다.
  const redirectUri = new URL(redirectUriEnv);
  if (request.headers.get("host") !== redirectUri.host) {
    return NextResponse.redirect(new URL("/api/spotify/login", redirectUri.origin));
  }

  // 잠금을 풀지 않은 사람이 다른 Spotify 계정으로 연결을 덮어쓰지 못하게 막는다.
  if (getPlayerLockState() !== "unlocked") {
    return NextResponse.json({ error: "재생 비밀번호를 먼저 입력하세요." }, { status: 401 });
  }

  // state는 돌아온 요청이 내가 시작한 로그인이 맞는지 확인하는 일회용 값이다.
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SPOTIFY_SCOPES,
    redirect_uri: redirectUriEnv,
    state,
  });

  const res = NextResponse.redirect(`https://accounts.spotify.com/authorize?${params}`);
  res.cookies.set("spotify_auth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  return res;
}
