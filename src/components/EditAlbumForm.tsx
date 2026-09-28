"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Album, AlbumStatus } from "@/types/album";

export default function EditAlbumForm({ album }: { album: Album }) {
  const router = useRouter();
  const [title, setTitle] = useState(album.title);
  const [artist, setArtist] = useState(album.artist);
  const [releaseDate, setReleaseDate] = useState(album.releaseDate);
  const [rating, setRating] = useState(String(album.rating));
  const [status, setStatus] = useState<AlbumStatus>(album.status);
  const [genre, setGenre] = useState(album.genre ?? "");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    let coverImageUrl = album.coverImageUrl ?? "";
    if (coverImage) {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", coverImage);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      setUploading(false);

      if (!uploadRes.ok) {
        setError("이미지 업로드에 실패했습니다.");
        return;
      }
      ({ url: coverImageUrl } = await uploadRes.json());
    }

    const res = await fetch(`/api/albums/${album.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, artist, releaseDate, rating, status, genre, coverImageUrl }),
    });

    if (!res.ok) {
      setError("수정에 실패했습니다. 다시 시도해 주세요.");
      return;
    }

    // router.push + router.refresh 조합이 배포 환경에서 경쟁 상태를 일으켜
    // 완전한 페이지 이동으로 클라이언트 라우터 캐시를 아예 우회한다.
    window.location.href = `/albums/${album.id}`;
  }

  return (
    <main className="max-w-md mx-auto px-6 py-10">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-xl font-bold text-gray-900 pb-4 border-b border-gray-100">
          앨범 수정
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              커버 이미지 <span className="text-gray-400">(선택, 바꾸지 않으려면 비워두세요)</span>
            </label>
            {album.coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={album.coverImageUrl}
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
              disabled={uploading}
              className="rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {uploading ? "업로드 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
