import Link from "next/link";
import AlbumCard from "@/components/AlbumCard";
import { getDb } from "@/lib/mongodb";
import { Album } from "@/types/album";

// 등록 직후 목록에 바로 반영되도록 캐시하지 않고 매번 새로 조회한다.
export const dynamic = "force-dynamic";

async function getAlbums(): Promise<Album[]> {
  const db = await getDb();
  const docs = await db.collection("albums").find().sort({ _id: -1 }).toArray();

  return docs.map((doc) => ({
    id: doc._id.toString(),
    title: doc.title,
    artist: doc.artist,
    releaseDate: doc.releaseDate,
    rating: doc.rating,
    status: doc.status,
    genre: doc.genre,
  }));
}

export default async function Home() {
  const albums = await getAlbums();

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

      {albums.length === 0 ? (
        <p className="text-sm text-gray-500">아직 등록된 앨범이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}
    </main>
  );
}
