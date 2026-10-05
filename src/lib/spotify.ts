const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_URL = "https://api.spotify.com/v1";

export type SpotifyAlbumResult = {
  spotifyId: string;
  title: string;
  artist: string;
  releaseDate: string;
  coverImageUrl: string;
  spotifyUrl: string;
};

export type SpotifyTrack = {
  id: string;
  name: string;
  trackNumber: number;
  discNumber: number;
  durationMs: number;
  spotifyUrl: string;
};

type SpotifyTrackItem = {
  id: string;
  name: string;
  track_number: number;
  disc_number: number;
  duration_ms: number;
  external_urls: { spotify: string };
};

type SpotifyAlbumItem = {
  id: string;
  name: string;
  release_date: string;
  artists: { name: string }[];
  images: { url: string }[];
  external_urls: { spotify: string };
};

export type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
};

// 앱 키(Client ID/Secret)로 Spotify 토큰 서버에 요청한다. 앱 전용 토큰과 사용자 토큰 모두 이 함수를 쓴다.
export async function requestToken(params: Record<string, string>): Promise<TokenResponse> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET 환경변수가 없습니다.");
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: new URLSearchParams(params),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Spotify 토큰 발급 실패: ${res.status}`);
  }
  return res.json();
}

// 토큰은 1시간 동안 유효해서, 만료 1분 전까지는 새로 받지 않고 재사용한다.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const data = await requestToken({ grant_type: "client_credentials" });
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

// Spotify 발매일은 "1997", "1997-05"처럼 일부만 오기도 해서 날짜 입력칸 형식(YYYY-MM-DD)으로 맞춘다.
function toFullDate(date: string): string {
  if (date.length === 4) return `${date}-01-01`;
  if (date.length === 7) return `${date}-01`;
  return date;
}

async function spotifyGet(url: string) {
  const token = await getAccessToken();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Spotify 요청 실패 (${res.status}): ${url}`);
  }
  return res.json();
}

export async function searchAlbums(query: string): Promise<SpotifyAlbumResult[]> {
  const params = new URLSearchParams({ q: query, type: "album", limit: "10" });
  const data = await spotifyGet(`${API_URL}/search?${params}`);
  return data.albums.items.map((item: SpotifyAlbumItem) => ({
    spotifyId: item.id,
    title: item.name,
    artist: item.artists.map((a) => a.name).join(", "),
    releaseDate: toFullDate(item.release_date),
    coverImageUrl: item.images[0]?.url ?? "",
    spotifyUrl: item.external_urls.spotify,
  }));
}

// Spotify 앨범 ID는 영문·숫자 22글자다. 다른 값이 들어오면 Spotify 주소를 만들지 않는다.
export const SPOTIFY_ID_PATTERN = /^[A-Za-z0-9]{22}$/;

export async function getAlbumTracks(spotifyId: string): Promise<SpotifyTrack[]> {
  if (!SPOTIFY_ID_PATTERN.test(spotifyId)) {
    return [];
  }

  const album = await spotifyGet(`${API_URL}/albums/${spotifyId}`);
  const items: SpotifyTrackItem[] = [...album.tracks.items];

  // 클래식 전집처럼 곡이 많은 앨범은 수록곡이 여러 번에 나눠서 오므로 다음 페이지를 이어서 받는다.
  let next: string | null = album.tracks.next;
  while (next) {
    const page = await spotifyGet(next);
    items.push(...page.items);
    next = page.next;
  }

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    trackNumber: item.track_number,
    discNumber: item.disc_number,
    durationMs: item.duration_ms,
    spotifyUrl: item.external_urls.spotify,
  }));
}
