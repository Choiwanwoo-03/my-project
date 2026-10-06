import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const UNLOCK_COOKIE = "player_unlocked";

// 쿠키에는 비밀번호 자체가 아니라 비밀번호로 만든 해시를 넣는다. 비밀번호를 모르면 이 값을 만들 수 없다.
function unlockToken(password: string): string {
  return createHash("sha256").update(`player:${password}`).digest("hex");
}

// 글자를 하나씩 비교하면 걸린 시간으로 정답을 추측할 수 있어서, 항상 같은 시간이 걸리는 방식으로 비교한다.
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export type PlayerLockState = "unlocked" | "locked" | "misconfigured";

// 로컬 개발 중에는 비밀번호를 정하지 않으면 잠그지 않고,
// 배포 환경에서 비밀번호를 깜빡하면 재생을 아예 막아 실수로 열리지 않게 한다.
export function getPlayerLockState(): PlayerLockState {
  const password = process.env.PLAYER_PASSWORD;
  if (!password) {
    return process.env.NODE_ENV === "production" ? "misconfigured" : "unlocked";
  }
  const cookie = cookies().get(UNLOCK_COOKIE)?.value ?? "";
  return safeEqual(cookie, unlockToken(password)) ? "unlocked" : "locked";
}

// 비밀번호가 맞으면 쿠키에 넣을 값을, 틀리면 null을 돌려준다.
export function checkPlayerPassword(input: string): string | null {
  const password = process.env.PLAYER_PASSWORD;
  if (!password) {
    return null;
  }
  const expected = unlockToken(password);
  return safeEqual(unlockToken(input), expected) ? expected : null;
}
