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

type SpotifyAlbumItem = {
  id: string;
  name: string;
  release_date: string;
  artists: { name: string }[];
  images: { url: string }[];
  external_urls: { spotify: string };
};

// 토큰은 1시간 동안 유효해서, 만료 1분 전까지는 새로 받지 않고 재사용한다.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

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
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Spotify 토큰 발급 실패: ${res.status}`);
  }

  const data = await res.json();
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

export async function searchAlbums(query: string): Promise<SpotifyAlbumResult[]> {
  const token = await getAccessToken();
  const params = new URLSearchParams({ q: query, type: "album", limit: "10" });

  const res = await fetch(`${API_URL}/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Spotify 검색 실패: ${res.status}`);
  }

  const data = await res.json();
  return data.albums.items.map((item: SpotifyAlbumItem) => ({
    spotifyId: item.id,
    title: item.name,
    artist: item.artists.map((a) => a.name).join(", "),
    releaseDate: toFullDate(item.release_date),
    coverImageUrl: item.images[0]?.url ?? "",
    spotifyUrl: item.external_urls.spotify,
  }));
}
