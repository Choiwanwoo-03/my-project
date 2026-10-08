"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Album } from "@/types/album";
import type { SpotifyAlbumResult } from "@/lib/spotify";
import SpotifySearch from "@/components/SpotifySearch";

export default function EditAlbumForm({ album }: { album: Album }) {
  const router = useRouter();
  const [title, setTitle] = useState(album.title);
  const [artist, setArtist] = useState(album.artist);
  const [releaseDate, setReleaseDate] = useState(album.releaseDate);
  const [rating, setRating] = useState(String(album.rating));
  const [genre, setGenre] = useState(album.genre ?? "");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [spotifyCoverUrl, setSpotifyCoverUrl] = useState("");
  const [spotifyId, setSpotifyId] = useState(album.spotifyId ?? "");

  function handlePick(picked: SpotifyAlbumResult) {
    setTitle(picked.title);
    setArtist(picked.artist);
    setReleaseDate(picked.releaseDate);
    setSpotifyCoverUrl(picked.coverImageUrl);
    setSpotifyId(picked.spotifyId);
  }

  // Spotify에서 새로 고른 커버가 있으면 그걸, 없으면 원래 커버를 쓴다.
  const currentCoverUrl = spotifyCoverUrl || album.coverImageUrl || "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    // 이미지 업로드부터 앨범 저장까지 끝날 때까지 버튼을 막아서, 연타해도 두 번 저장되지 않게 한다.
    setSubmitting(true);
    // window.location.href는 페이지 이동을 "시작"만 하고 바로 다음 줄로 넘어간다.
    // 그래서 저장에 성공한 뒤 finally에서 무조건 버튼을 풀면, 새 상세 화면이 실제로
    // 뜨기 전(서버가 MongoDB를 조회하는 그 짧은 시간) 버튼이 다시 눌려 두 번 저장될 수 있다.
    // leaving이 true면(=이동을 시작했으면) finally에서 버튼을 풀지 않는다.
    let leaving = false;

    try {
      let coverImageUrl = currentCoverUrl;
      if (coverImage) {
        const formData = new FormData();
        formData.append("file", coverImage);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });

        if (!uploadRes.ok) {
          setError(
            uploadRes.status === 401
              ? "잠금이 걸려 있어 업로드할 수 없습니다. 재생 잠금을 먼저 해제하세요."
              : "이미지 업로드에 실패했습니다."
          );
          return;
        }
        ({ url: coverImageUrl } = await uploadRes.json());
      }

      const res = await fetch(`/api/albums/${album.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, artist, releaseDate, rating, genre, coverImageUrl, spotifyId }),
      });

      if (!res.ok) {
        setError(
          res.status === 401
            ? "잠금이 걸려 있어 수정할 수 없습니다. 재생 잠금을 먼저 해제하세요."
            : "수정에 실패했습니다. 다시 시도해 주세요."
        );
        return;
      }

      leaving = true;
      // router.push + router.refresh 조합이 배포 환경에서 경쟁 상태를 일으켜
      // 완전한 페이지 이동으로 클라이언트 라우터 캐시를 아예 우회한다.
      window.location.href = `/albums/${album.id}`;
    } catch {
      setError("네트워크 오류로 수정하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      // 성공해서 페이지를 떠나는 중이면, 새 화면이 뜰 때까지 버튼을 계속 막아 둔다.
      if (!leaving) setSubmitting(false);
    }
  }

  return (
    <main className="max-w-md mx-auto px-6 py-10">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-xl font-bold text-gray-900 pb-4 border-b border-gray-100">
          앨범 수정
        </h1>

        <p className="mt-4 text-sm text-gray-500">
          {spotifyId
            ? "✓ Spotify에 연결된 앨범입니다. 다른 앨범으로 바꾸려면 다시 검색하세요."
            : "Spotify에 연결하면 커버, 수록곡, 재생 기능이 생깁니다."}
        </p>
        <SpotifySearch onPick={handlePick} />

        <form onSubmit={handleSubmit} className="space-y-4 mt-6 pt-6 border-t border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">앨범명</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">아티스트</label>
            <input
              type="text"
              required
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">발매일</label>
            <input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">평점</label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              장르 <span className="text-gray-400">(선택)</span>
            </label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              커버 이미지 <span className="text-gray-400">(선택, 바꾸지 않으려면 비워두세요)</span>
            </label>
            {currentCoverUrl && !coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentCoverUrl}
                alt={album.title}
                className="w-24 h-24 object-cover rounded-lg mb-2"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-700"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push(`/albums/${album.id}`)}
              className="rounded-lg border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
