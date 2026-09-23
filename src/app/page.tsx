import Link from "next/link";
import AlbumCard from "@/components/AlbumCard";
import { mockAlbums } from "@/data/mock-albums";

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">내 앨범 기록</h1>
        <Link
          href="/new"
          className="rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition-colors"
        >
          + 새 앨범 등록
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockAlbums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
    </main>
  );
}
