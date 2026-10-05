import type { SpotifyTrack } from "@/lib/spotify";

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

export default function TrackList({ tracks }: { tracks: SpotifyTrack[] }) {
  const totalMs = tracks.reduce((sum, track) => sum + track.durationMs, 0);
  // 디스크가 여러 장인 앨범은 곡 번호가 장마다 1부터 다시 시작해서 "디스크-번호"로 보여준다.
  const isMultiDisc = tracks.some((track) => track.discNumber > 1);

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-gray-900">
        수록곡{" "}
        <span className="text-sm font-normal text-gray-500">
          {tracks.length}곡 · {formatTotalTime(totalMs)}
        </span>
      </h2>

      <ol className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
        {tracks.map((track) => (
          <li key={track.id} className="flex items-center gap-4 px-4 py-2.5 text-sm">
            <span className="w-10 shrink-0 text-right text-gray-400 tabular-nums">
              {isMultiDisc ? `${track.discNumber}-${track.trackNumber}` : track.trackNumber}
            </span>
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
        ))}
      </ol>
    </section>
  );
}
