import HomeSplitLayout from "@/components/HomeSplitLayout";
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

async function getAlbums(query?: string, sort?: string, genre?: string): Promise<Album[]> {
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
  if (genre) {
    conditions.push({ genre });
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

// 장르는 자유 입력이라, 지금까지 저장된 장르 값들을 모아서 필터 목록으로 쓴다.
async function getGenres(): Promise<string[]> {
  const db = await getDb();
  const genres: unknown[] = await db.collection("albums").distinct("genre");
  return genres
    .filter((genre): genre is string => typeof genre === "string" && genre.trim() !== "")
    .sort((a, b) => a.localeCompare(b, "ko"));
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
  searchParams: { q?: string; sort?: string; genre?: string };
}) {
  const query = searchParams.q ?? "";
  const sort = searchParams.sort ?? "";
  const genre = searchParams.genre ?? "";
  const [albums, stats, genres] = await Promise.all([
    getAlbums(query, sort, genre),
    getStats(),
    getGenres(),
  ]);

  return (
    <HomeSplitLayout
      query={query}
      sort={sort}
      genre={genre}
      stats={stats}
      genres={genres}
      albums={albums}
    />
  );
}
