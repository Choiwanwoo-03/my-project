import { getDb } from "@/lib/mongodb";
import { requestToken } from "@/lib/spotify";

// 웹 플레이어(Web Playback SDK)와 재생 제어에 꼭 필요한 권한만 요청한다.
export const SPOTIFY_SCOPES =
  "streaming user-read-email user-read-private user-modify-playback-state";

// 혼자 쓰는 앱이라 연결된 Spotify 계정은 하나뿐이다. DB에 문서 하나로 저장한다.
type SpotifyAuthDoc = { _id: string; refreshToken: string };
const AUTH_DOC_ID = "owner";

let cachedUserToken: { value: string; expiresAt: number } | null = null;

async function saveRefreshToken(refreshToken: string) {
  const db = await getDb();
  await db
    .collection<SpotifyAuthDoc>("spotify_auth")
    .updateOne({ _id: AUTH_DOC_ID }, { $set: { refreshToken } }, { upsert: true });
}

// Spotify 로그인 후 돌아온 인증 코드를 토큰으로 바꾸고, 오래 쓰는 refresh token을 저장한다.
export async function connectWithCode(code: string, redirectUri: string) {
  const data = await requestToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  if (!data.refresh_token) {
    throw new Error("Spotify가 refresh token을 주지 않았습니다.");
  }
  await saveRefreshToken(data.refresh_token);
  cachedUserToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
}

// 저장된 refresh token으로 1시간짜리 사용자 토큰을 받는다. 아직 연결 전이면 null.
export async function getUserAccessToken(): Promise<string | null> {
  if (cachedUserToken && Date.now() < cachedUserToken.expiresAt) {
    return cachedUserToken.value;
  }

  const db = await getDb();
  const auth = await db.collection<SpotifyAuthDoc>("spotify_auth").findOne({ _id: AUTH_DOC_ID });
  if (!auth) {
    return null;
  }

  const data = await requestToken({
    grant_type: "refresh_token",
    refresh_token: auth.refreshToken,
  });
  // Spotify가 새 refresh token을 주면 예전 것은 곧 못 쓰게 되므로 바로 바꿔 저장한다.
  if (data.refresh_token) {
    await saveRefreshToken(data.refresh_token);
  }

  cachedUserToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedUserToken.value;
}
