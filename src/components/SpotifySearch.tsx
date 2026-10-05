"use client";

import { useState } from "react";
import type { SpotifyAlbumResult } from "@/lib/spotify";

export default function SpotifySearch({
  onPick,
}: {
  onPick: (album: SpotifyAlbumResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyAlbumResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setMessage("");
    setSearching(true);
    const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
    setSearching(false);

    if (!res.ok) {
      setMessage("Spotify 검색에 실패했습니다.");
      return;
    }
    const data = await res.json();
    setResults(data.albums);
    if (data.albums.length === 0) {
      setMessage("검색 결과가 없습니다.");
    }
  }

  function handlePick(album: SpotifyAlbumResult) {
    onPick(album);
    setResults([]);
    setMessage(`"${album.title}" 정보를 채웠습니다. 나머지 항목을 확인하세요.`);
  }

  return (
    <form onSubmit={handleSearch} className="mt-6">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Spotify에서 찾기 <span className="text-gray-400">(선택)</span>
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="앨범명이나 아티스트로 검색"
          className="flex-1 min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
        />
        <button
          type="submit"
          disabled={searching}
          className="rounded-lg bg-[#1DB954] text-white text-sm font-medium px-4 py-2 hover:bg-[#1aa34a] transition-colors disabled:opacity-50"
        >
          {searching ? "검색 중..." : "검색"}
        </button>
      </div>

      {message && <p className="mt-2 text-sm text-gray-500">{message}</p>}

      {results.length > 0 && (
        <ul className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
          {results.map((album) => (
            <li key={album.spotifyId}>
              <button
                type="button"
                onClick={() => handlePick(album)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50"
              >
                {album.coverImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={album.coverImageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                )}
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-900 truncate">
                    {album.title}
                  </span>
                  <span className="block text-xs text-gray-500 truncate">
                    {album.artist} · {album.releaseDate.slice(0, 4)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
