import { SPOTIFY_ID_PATTERN, spotifyAlbumUrl } from "@/lib/spotify";

const RELEASE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TEXT_LENGTH = 200;

export type AlbumInput = {
  title: string;
  artist: string;
  releaseDate: string;
  rating: number;
  genre: string;
  coverImageUrl: string;
  spotifyId: string;
  spotifyUrl: string;
};

export type ParseResult =
  | { ok: true; data: AlbumInput }
  | { ok: false; error: string };

// POST(등록)와 PUT(수정)이 같이 쓰는 입력 검증. 값이 있는지뿐 아니라 타입·범위·형식까지 확인해서,
// 이상한 값이 DB에 들어가 목록 화면을 통째로 깨뜨리는 일을 막는다.
export function parseAlbumInput(body: unknown): ParseResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "잘못된 요청입니다." };
  }
  const { title, artist, releaseDate, rating, genre, coverImageUrl, spotifyId } =
    body as Record<string, unknown>;

  if (typeof title !== "string" || title.trim().length === 0 || title.length > MAX_TEXT_LENGTH) {
    return { ok: false, error: "앨범명을 확인하세요." };
  }
  if (typeof artist !== "string" || artist.trim().length === 0 || artist.length > MAX_TEXT_LENGTH) {
    return { ok: false, error: "아티스트를 확인하세요." };
  }

  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return { ok: false, error: "평점은 1~5 사이의 정수여야 합니다." };
  }

  let safeReleaseDate = "";
  if (releaseDate) {
    if (typeof releaseDate !== "string" || !RELEASE_DATE_PATTERN.test(releaseDate)) {
      return { ok: false, error: "발매일 형식이 올바르지 않습니다 (YYYY-MM-DD)." };
    }
    safeReleaseDate = releaseDate;
  }

  if (genre !== undefined && genre !== "" && (typeof genre !== "string" || genre.length > MAX_TEXT_LENGTH)) {
    return { ok: false, error: "장르를 확인하세요." };
  }

  if (coverImageUrl && (typeof coverImageUrl !== "string" || !coverImageUrl.startsWith("https://"))) {
    return { ok: false, error: "잘못된 이미지 주소입니다." };
  }

  // spotifyId만 저장하고, Spotify 주소는 항상 서버가 이 값으로 직접 만든다.
  // 클라이언트가 보낸 spotifyUrl 문자열은 그대로 믿지 않는다.
  const validSpotifyId = typeof spotifyId === "string" && SPOTIFY_ID_PATTERN.test(spotifyId);

  return {
    ok: true,
    data: {
      title: title.trim(),
      artist: artist.trim(),
      releaseDate: safeReleaseDate,
      rating: ratingNum,
      genre: typeof genre === "string" ? genre.trim() : "",
      coverImageUrl: typeof coverImageUrl === "string" ? coverImageUrl : "",
      spotifyId: validSpotifyId ? (spotifyId as string) : "",
      spotifyUrl: validSpotifyId ? (spotifyAlbumUrl(spotifyId as string) ?? "") : "",
    },
  };
}
