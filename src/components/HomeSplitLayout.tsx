"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AlbumCard from "@/components/AlbumCard";
import SortSelect from "@/components/SortSelect";
import GenreFilter from "@/components/GenreFilter";
import NewAlbumButton from "@/components/NewAlbumButton";
import HomeTurntable from "@/components/HomeTurntable";
import { Album } from "@/types/album";

const DEFAULT_LEFT_PERCENT = 40;
const MIN_LEFT_PERCENT = 24;
const MAX_LEFT_PERCENT = 60;

type Stats = {
  total: number;
  averageRating: number;
};

export default function HomeSplitLayout({
  query,
  sort,
  genre,
  stats,
  genres,
  albums,
}: {
  query: string;
  sort: string;
  genre: string;
  stats: Stats;
  genres: string[];
  albums: Album[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftPercent, setLeftPercent] = useState(DEFAULT_LEFT_PERCENT);
  const [dragging, setDragging] = useState(false);
  // 작은 화면에서는 좌/우를 퍼센트로 나누지 않고 위아래로 쌓는다 — lg 이상에서만 드래그 분할을 켠다.
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mql.matches);
    const handleChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  function handleDividerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    setLeftPercent(Math.min(MAX_LEFT_PERCENT, Math.max(MIN_LEFT_PERCENT, percent)));
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-col lg:flex-row lg:h-screen ${dragging ? "select-none" : ""}`}
    >
      <div
        className="w-full px-6 py-8 lg:flex-shrink-0 lg:overflow-y-auto"
        style={isDesktop ? { width: `${leftPercent}%` } : undefined}
      >
        <h1 className="mb-6 text-2xl font-bold text-gray-900">바이닐로그</h1>
        <HomeTurntable />
      </div>

      {/* 좌/우 경계선: 눌러서 끌면 LP 화면 너비가 바뀐다 */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="LP 화면 너비 조절"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
        }}
        onPointerMove={handleDividerMove}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          setDragging(false);
        }}
        onPointerCancel={() => setDragging(false)}
        className={`hidden lg:block w-1.5 flex-shrink-0 cursor-col-resize touch-none transition-colors ${
          dragging ? "bg-indigo-400" : "bg-gray-200 hover:bg-indigo-300"
        }`}
      />

      <div className="min-w-0 flex-1 px-6 py-8 lg:overflow-y-auto">
        <div className="mb-8 flex justify-end">
          <NewAlbumButton />
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

        {albums.length === 0 ? (
          <p className="text-sm text-gray-500">
            {query || genre ? "조건에 맞는 앨범이 없습니다." : "아직 등록된 앨범이 없습니다."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
