"use client";

import { useState } from "react";
import type { SpotifyAlbumResult } from "@/lib/spotify";
import SpotifySearch from "@/components/SpotifySearch";

export default function NewAlbumButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition-colors"
      >
        + 새 앨범 등록
      </button>
      {open && <NewAlbumModal onClose={() => setOpen(false)} />}
    </>
  );
}

function NewAlbumModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [rating, setRating] = useState("5");
  const [genre, setGenre] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [spotifyCoverUrl, setSpotifyCoverUrl] = useState("");
  const [spotifyId, setSpotifyId] = useState("");

  function handlePick(album: SpotifyAlbumResult) {
    setTitle(album.title);
    setArtist(album.artist);
    setReleaseDate(album.releaseDate);
    setSpotifyCoverUrl(album.coverImageUrl);
    setSpotifyId(album.spotifyId);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    // 이미지 업로드부터 앨범 저장까지 끝날 때까지 버튼을 막아서, 연타해도 두 번 등록되지 않게 한다.
    setSubmitting(true);
    // window.location.href는 페이지 이동을 "시작"만 하고 바로 다음 줄로 넘어간다.
    // 그래서 저장에 성공한 뒤 finally에서 무조건 버튼을 풀면, 새 목록 화면이 실제로
    // 뜨기 전(서버가 MongoDB를 조회하는 그 짧은 시간) 버튼이 다시 눌려 두 번 등록될 수 있다.
    // leaving이 true면(=이동을 시작했으면) finally에서 버튼을 풀지 않는다.
    let leaving = false;

    try {
      let coverImageUrl = spotifyCoverUrl;
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

      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, artist, releaseDate, rating, genre, coverImageUrl, spotifyId }),
      });

      if (!res.ok) {
        setError(
          res.status === 401
            ? "잠금이 걸려 있어 저장할 수 없습니다. 재생 잠금을 먼저 해제하세요."
            : "저장에 실패했습니다. 다시 시도해 주세요."
        );
        return;
      }

      leaving = true;
      // 모달을 닫고 목록을 새로 그리는 가장 간단하고 확실한 방법 — 같은 주소로 다시 이동해도
      // 브라우저는 전체 새로고침을 한다. router.push/refresh 조합이 배포 환경에서
      // 경쟁 상태를 일으켰던 적이 있어(등록·수정·삭제 공통) 이 방식을 그대로 따른다.
      window.location.href = "/";
    } catch {
      setError("네트워크 오류로 저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      if (!leaving) setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h1 className="text-xl font-bold text-gray-900">새 앨범 등록</h1>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <SpotifySearch onPick={handlePick} />

        <form onSubmit={handleSubmit} className="space-y-4 mt-6 pt-6 border-t border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">앨범명</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: OK Computer"
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
              placeholder="예: Radiohead"
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
              placeholder="예: 얼터너티브 록"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              커버 이미지 <span className="text-gray-400">(선택)</span>
            </label>
            {spotifyCoverUrl && !coverImage && (
              <div className="flex items-center gap-3 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={spotifyCoverUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
                <span className="text-xs text-gray-500">
                  Spotify 커버를 사용합니다. 파일을 고르면 그 사진으로 바뀝니다.
                </span>
              </div>
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
              onClick={onClose}
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
    </div>
  );
}
