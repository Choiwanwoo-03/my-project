import { NextResponse } from "next/server";
import { checkPlayerPassword, UNLOCK_COOKIE } from "@/lib/player-lock";

export async function POST(request: Request) {
  const { password } = await request.json();
  if (typeof password !== "string") {
    return NextResponse.json({ error: "비밀번호를 입력하세요." }, { status: 400 });
  }

  const token = checkPlayerPassword(password);
  if (!token) {
    return NextResponse.json({ error: "비밀번호가 틀렸습니다." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(UNLOCK_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
