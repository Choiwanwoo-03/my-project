"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import SortSelect from "@/components/SortSelect";
import GenreFilter from "@/components/GenreFilter";

export default function SearchFilterBar({
  query,
  sort,
  genre,
  genres,
}: {
  query: string;
  sort: string;
  genre: string;
  genres: string[];
}) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // 네이티브 GET 제출은 브라우저가 페이지를 통째로 새로고침한다 — 재생 중이던 음악이 끊기는 원인.
    // 같은 정보를 담아 클라이언트 라우팅(router.push)으로 대신 이동한다.
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    Array.from(formData.entries()).forEach(([key, value]) => {
      if (typeof value === "string" && value.trim() !== "") {
        params.set(key, value);
      }
    });
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap gap-2">
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
      <GenreFilter genres={genres} defaultValue={genre} />
      {(query || sort || genre) && (
        <Link
          href="/"
          className="rounded-lg text-gray-500 text-sm font-medium px-4 py-2 hover:bg-gray-50 transition-colors"
        >
          초기화
        </Link>
      )}
    </form>
  );
}
