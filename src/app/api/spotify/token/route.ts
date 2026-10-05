import { NextResponse } from "next/server";
import { getUserAccessToken } from "@/lib/spotify-auth";

export const dynamic = "force-dynamic";

export async function GET() {
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
