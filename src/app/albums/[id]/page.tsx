import Link from "next/link";
import { notFound } from "next/navigation";
import { mockAlbums } from "@/data/mock-albums";
import { gradientFor } from "@/lib/gradient";
import { STATUS_STYLES } from "@/lib/status-styles";
import StarRating from "@/components/StarRating";

export default function AlbumDetailPage({ params }: { params: { id: string } }) {
  const album = mockAlbums.find((a) => a.id === params.id);

  if (!album) {
    notFound();
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← 목록으로
      </Link>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className={`aspect-square rounded-xl bg-gradient-to-b ${gradientFor(album.id)}`} />

        <div>
          <h1 className="text-2xl font-bold text-gray-900">{album.title}</h1>
          <p className="text-gray-500 mt-1 pb-4 border-b border-gray-100">{album.artist}</p>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">발매일</dt>
              <dd className="text-gray-900">{album.releaseDate || "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">평점</dt>
              <dd>
                <StarRating rating={album.rating} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">상태</dt>
              <dd>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[album.status]}`}>
                  {album.status}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">장르</dt>
              <dd className="text-gray-900">{album.genre || "-"}</dd>
            </div>
          </dl>

          <div className="mt-4 flex gap-2">
            <button
              disabled
              className="rounded-lg border border-gray-300 text-gray-400 text-sm font-medium px-4 py-2 cursor-not-allowed"
            >
              수정
            </button>
            <button
              disabled
              className="rounded-lg border border-red-200 text-red-300 text-sm font-medium px-4 py-2 cursor-not-allowed"
            >
              삭제
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400">* 수정 · 삭제는 2단계에서 구현</p>
        </div>
      </div>
    </main>
  );
}
