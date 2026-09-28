import Link from "next/link";
import AlbumCard from "@/components/AlbumCard";
import SortSelect from "@/components/SortSelect";
import StatusFilter from "@/components/StatusFilter";
import { getDb } from "@/lib/mongodb";
import { Album, AlbumStatus } from "@/types/album";

// 등록 직후 목록에 바로 반영되도록 캐시하지 않고 매번 새로 조회한다.
export const dynamic = "force-dynamic";

const SORT_OPTIONS: Record<string, Record<string, 1 | -1>> = {
  rating: { rating: -1 },
  releaseDate: { releaseDate: -1 },
};

async function getAlbums(
  query?: string,
  sort?: string,
  status?: AlbumStatus | ""
): Promise<Album[]> {
  const db = await getDb();
  const conditions = [];
  if (query) {
    conditions.push({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { artist: { $regex: query, $options: "i" } },
      ],
    });
  }
  if (status) {
    conditions.push({ status });
  }
  const filter = conditions.length > 0 ? { $and: conditions } : {};
  const sortSpec = (sort && SORT_OPTIONS[sort]) || { _id: -1 };

  const docs = await db.collection("albums").find(filter).sort(sortSpec).toArray();

  return docs.map((doc) => ({
    id: doc._id.toString(),
    title: doc.title,
    artist: doc.artist,
    releaseDate: doc.releaseDate,
    rating: doc.rating,
    status: doc.status,
    genre: doc.genre,
    coverImageUrl: doc.coverImageUrl,
  }));
}

type Stats = {
  total: number;
  averageRating: number;
  countByStatus: Record<AlbumStatus, number>;
};

async function getStats(): Promise<Stats> {
  const db = await getDb();
  const docs = await db
    .collection("albums")
    .find({}, { projection: { rating: 1, status: 1 } })
    .toArray();

  const countByStatus: Record<AlbumStatus, number> = {
    듣는중: 0,
    다들음: 0,
    인생앨범: 0,
  };
  let ratingSum = 0;

  for (const doc of docs) {
    ratingSum += doc.rating;
    countByStatus[doc.status as AlbumStatus]++;
  }

  return {
    total: docs.length,
    averageRating: docs.length > 0 ? ratingSum / docs.length : 0,
    countByStatus,
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string; status?: AlbumStatus | "" };
}) {
  const query = searchParams.q ?? "";
  const sort = searchParams.sort ?? "";
  const status = searchParams.status ?? "";
  const [albums, stats] = await Promise.all([
    getAlbums(query, sort, status),
    getStats(),
  ]);

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

      {stats.total > 0 && (
        <div className="mb-6 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-4 py-3">
          <span>
            총 <strong className="text-gray-900">{stats.total}</strong>개
          </span>
          <span>
            평균 평점 <strong className="text-gray-900">{stats.averageRating.toFixed(1)}</strong>
          </span>
          <span>
            듣는중 <strong className="text-gray-900">{stats.countByStatus["듣는중"]}</strong>
          </span>
          <span>
            다들음 <strong className="text-gray-900">{stats.countByStatus["다들음"]}</strong>
          </span>
          <span>
            인생앨범 <strong className="text-gray-900">{stats.countByStatus["인생앨범"]}</strong>
          </span>
        </div>
      )}

      <form action="/" method="GET" className="mb-6 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="앨범명 또는 아티스트로 검색"
          className="flex-1 max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
        <button
          type="submit"
          className="rounded-lg border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 hover:bg-gray-50 transition-colors"
        >
          검색
        </button>
        <SortSelect defaultValue={sort} />
        <StatusFilter defaultValue={status} />
        {(query || sort || status) && (
          <Link
            href="/"
            className="rounded-lg text-gray-500 text-sm font-medium px-4 py-2 hover:bg-gray-50 transition-colors"
          >
            초기화
          </Link>
        )}
      </form>

      {albums.length === 0 ? (
        <p className="text-sm text-gray-500">
          {query || status
            ? "조건에 맞는 앨범이 없습니다."
            : "아직 등록된 앨범이 없습니다."}
        </p>
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
