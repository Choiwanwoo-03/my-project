"use client";

import Link from "next/link";
import { usePlayer } from "@/components/SpotifyPlayer";
import Turntable from "@/components/Turntable";

export default function PlayerPage() {
  const { nowPlaying } = usePlayer();

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      {nowPlaying?.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={nowPlaying.coverUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-3xl"
        />
      )}

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-10">
        <Link href="/" className="self-start text-sm text-white/60 hover:text-white">
          ← 메인으로
        </Link>

        <div className="mt-8 w-full">
          <Turntable
            size="large"
            emptyStateExtra={
              <Link
                href="/"
                className="mt-4 inline-block rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
              >
                앨범 목록으로
              </Link>
            }
          />
        </div>
      </div>
    </main>
  );
}
