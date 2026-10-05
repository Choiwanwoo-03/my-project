import { NextRequest, NextResponse } from "next/server";
import { connectWithCode } from "@/lib/spotify-auth";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = request.cookies.get("spotify_auth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.json(
      { error: "Spotify 연결 확인에 실패했습니다. 다시 시도해 주세요." },
      { status: 400 }
    );
  }

  try {
    await connectWithCode(code, process.env.SPOTIFY_REDIRECT_URI ?? "");
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Spotify 연결에 실패했습니다." }, { status: 502 });
  }

  const res = NextResponse.redirect(new URL("/", request.url));
  res.cookies.delete("spotify_auth_state");
  return res;
}
