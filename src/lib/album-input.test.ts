import { describe, expect, it } from "vitest";
import { parseAlbumInput } from "@/lib/album-input";

const SPOTIFY_ID = "4aawyAB9vmqN3uQ7FjRGTy";

const valid = {
  title: "  Abbey Road ",
  artist: "The Beatles",
  releaseDate: "1969-09-26",
  rating: 5,
  genre: "Rock",
  coverImageUrl: "https://example.com/cover.jpg",
  spotifyId: SPOTIFY_ID,
};

describe("parseAlbumInput", () => {
  it("올바른 입력은 앞뒤 공백을 지우고 spotifyUrl을 서버에서 만든다", () => {
    const result = parseAlbumInput(valid);

    expect(result).toEqual({
      ok: true,
      data: {
        title: "Abbey Road",
        artist: "The Beatles",
        releaseDate: "1969-09-26",
        rating: 5,
        genre: "Rock",
        coverImageUrl: "https://example.com/cover.jpg",
        spotifyId: SPOTIFY_ID,
        spotifyUrl: `https://open.spotify.com/album/${SPOTIFY_ID}`,
      },
    });
  });

  it("객체가 아니면 거부한다", () => {
    expect(parseAlbumInput(null).ok).toBe(false);
    expect(parseAlbumInput("text").ok).toBe(false);
  });

  it("앨범명·아티스트가 비어 있으면 거부한다", () => {
    expect(parseAlbumInput({ ...valid, title: "   " }).ok).toBe(false);
    expect(parseAlbumInput({ ...valid, artist: "" }).ok).toBe(false);
  });

  it.each([0, 6, 3.5, "abc"])("평점 %s 은(는) 거부한다", (rating) => {
    expect(parseAlbumInput({ ...valid, rating }).ok).toBe(false);
  });

  it("발매일이 YYYY-MM-DD 형식이 아니면 거부한다", () => {
    expect(parseAlbumInput({ ...valid, releaseDate: "1969/09/26" }).ok).toBe(false);
  });

  it("https가 아닌 이미지 주소는 거부한다", () => {
    expect(parseAlbumInput({ ...valid, coverImageUrl: "javascript:alert(1)" }).ok).toBe(false);
  });

  it("클라이언트가 보낸 spotifyUrl은 무시하고, 잘못된 spotifyId는 빈 값으로 저장한다", () => {
    const result = parseAlbumInput({
      ...valid,
      spotifyId: "not-valid",
      spotifyUrl: "https://evil.example.com",
    });

    expect(result.ok && result.data.spotifyId).toBe("");
    expect(result.ok && result.data.spotifyUrl).toBe("");
  });
});
