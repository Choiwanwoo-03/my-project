import { NextResponse } from "next/server";
import { searchAlbums } from "@/lib/spotify";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ error: "검색어를 입력하세요." }, { status: 400 });
  }

  try {
    const albums = await searchAlbums(query);
    return NextResponse.json({ albums });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Spotify 검색에 실패했습니다." }, { status: 502 });
  }
}
