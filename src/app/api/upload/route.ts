import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getPlayerLockState } from "@/lib/player-lock";

export async function POST(request: Request) {
  if (getPlayerLockState() !== "unlocked") {
    return NextResponse.json({ error: "잠금을 먼저 해제해야 합니다." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  const blob = await put(file.name, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ url: blob.url });
}
