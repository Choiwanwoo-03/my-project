import Link from "next/link";
import AlbumCard from "@/components/AlbumCard";
import SortSelect from "@/components/SortSelect";
import { getDb } from "@/lib/mongodb";
import { Album } from "@/types/album";

// 등록 직후 목록에 바로 반영되도록 캐시하지 않고 매번 새로 조회한다.
export const dynamic = "force-dynamic";

const SORT_OPTIONS: Record<string, Record<string, 1 | -1>> = {
  rating: { rating: -1 },
  releaseDate: { releaseDate: -1 },
};

// 검색어에 ( + . 같은 정규식 특수문자가 있어도 글자 그대로 찾도록 앞에 \ 를 붙인다.
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getAlbums(query?: string, sort?: string): Promise<Album[]> {
  const db = await getDb();
  const conditions = [];
  if (query) {
    const pattern = escapeRegex(query);
    conditions.push({
      $or: [
        { title: { $regex: pattern, $options: "i" } },
        { artist: { $regex: pattern, $options: "i" } },
      ],
    });
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
    genre: doc.genre,
    coverImageUrl: doc.coverImageUrl,
  }));
}

type Stats = {
  total: number;
  averageRating: number;
};

async function getStats(): Promise<Stats> {
  const db = await getDb();
  const docs = await db
    .collection("albums")
    .find({}, { projection: { rating: 1 } })
    .toArray();

  let ratingSum = 0;
  for (const doc of docs) {
    ratingSum += doc.rating;
  }

  return {
    total: docs.length,
    averageRating: docs.length > 0 ? ratingSum / docs.length : 0,
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string };
}) {
  const query = searchParams.q ?? "";
  const sort = searchParams.sort ?? "";
  const [albums, stats] = await Promise.all([
    getAlbums(query, sort),
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
        </div>
      )}

      <form action="/" method="GET" className="mb-6 flex flex-wrap gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="앨범명 또는 아티스트로 검색"
          className="flex-1 min-w-[160px] sm:max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
        <button
          type="submit"
          className="rounded-lg border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 hover:bg-gray-50 transition-colors"
        >
          검색
        </button>
        <SortSelect defaultValue={sort} />
        {(query || sort) && (
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
          {query
            ?"조건에 맞는 앨범이 없습니다."
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
