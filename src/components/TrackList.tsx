"use client";

import { useState } from "react";
import type { SpotifyTrack } from "@/lib/spotify";
import { usePlayAlbum } from "@/components/SpotifyPlayer";

function formatTrackTime(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatTotalTime(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
}

export default function TrackList({
  albumId,
  albumSpotifyId,
  tracks,
  initialFavoriteIds,
}: {
  albumId: string;
  albumSpotifyId: string;
  tracks: SpotifyTrack[];
  initialFavoriteIds: string[];
}) {
  const [favoriteIds, setFavoriteIds] = useState(initialFavoriteIds);
  const playAlbum = usePlayAlbum();

  const totalMs = tracks.reduce((sum, track) => sum + track.durationMs, 0);
  // 디스크가 여러 장인 앨범은 곡 번호가 장마다 1부터 다시 시작해서 "디스크-번호"로 보여준다.
  const isMultiDisc = tracks.some((track) => track.discNumber > 1);

  async function toggleFavorite(trackId: string) {
    const favorite = !favoriteIds.includes(trackId);
    const previous = favoriteIds;

    // 서버 응답을 기다리지 않고 별을 먼저 바꾸고, 저장에 실패하면 원래대로 되돌린다.
    setFavoriteIds(
      favorite ? [...favoriteIds, trackId] : favoriteIds.filter((id) => id !== trackId)
    );

    const res = await fetch(`/api/albums/${albumId}/favorites`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId, favorite }),
    });
    if (!res.ok) {
      setFavoriteIds(previous);
      alert("최애곡 저장에 실패했습니다.");
    }
  }

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-gray-900">
          수록곡{" "}
          <span className="text-sm font-normal text-gray-500">
            {tracks.length}곡 · {formatTotalTime(totalMs)}
            {favoriteIds.length > 0 && ` · 최애곡 ${favoriteIds.length}곡`}
          </span>
        </h2>
        <button
          type="button"
          onClick={() => playAlbum(albumSpotifyId)}
          className="shrink-0 rounded-full bg-[#1DB954] text-white text-sm font-medium px-4 py-2 hover:bg-[#1aa34a] transition-colors"
        >
          ▶ 전체 재생
        </button>
      </div>

      <ol className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
        {tracks.map((track, index) => {
          const isFavorite = favoriteIds.includes(track.id);
          return (
            <li
              key={track.id}
              className={`flex items-center gap-4 px-4 py-2.5 text-sm ${isFavorite ? "bg-yellow-50" : ""}`}
            >
              <button
                type="button"
                onClick={() => toggleFavorite(track.id)}
                aria-label={isFavorite ? "최애곡 해제" : "최애곡으로 표시"}
                className={`shrink-0 text-lg leading-none ${
                  isFavorite ? "text-yellow-400" : "text-gray-300 hover:text-yellow-400"
                }`}
              >
                {isFavorite ? "★" : "☆"}
              </button>
              {/* 곡 번호에 마우스를 올리면 ▶로 바뀌고, 누르면 앨범의 그 곡부터 재생한다. */}
              <button
                type="button"
                onClick={() => playAlbum(albumSpotifyId, index)}
                aria-label={`${track.name} 재생`}
                className="group w-10 shrink-0 text-right text-gray-400 tabular-nums hover:text-[#1DB954]"
              >
                <span className="group-hover:hidden">
                  {isMultiDisc ? `${track.discNumber}-${track.trackNumber}` : track.trackNumber}
                </span>
                <span className="hidden group-hover:inline">▶</span>
              </button>
              <a
                href={track.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 truncate text-gray-900 hover:underline"
              >
                {track.name}
              </a>
              <span className="shrink-0 text-gray-500 tabular-nums">
                {formatTrackTime(track.durationMs)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
