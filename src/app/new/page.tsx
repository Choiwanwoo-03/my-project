"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlbumStatus } from "@/types/album";

export default function NewAlbumPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [rating, setRating] = useState("5");
  const [status, setStatus] = useState<AlbumStatus>("듣는중");
  const [genre, setGenre] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // MongoDB 연결 전이라 실제 저장은 아직 하지 않는다.
    router.push("/");
  }

  return (
    <main className="max-w-md mx-auto px-6 py-10">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-xl font-bold text-gray-900 pb-4 border-b border-gray-100">
          새 앨범 등록
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
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

          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AlbumStatus)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="듣는중">듣는중</option>
                <option value="다들음">다들음</option>
                <option value="인생앨범">인생앨범</option>
              </select>
            </div>
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

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-lg border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition-colors"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
