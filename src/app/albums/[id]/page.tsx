import Link from "next/link";
import { notFound } from "next/navigation";
import { getAlbumById } from "@/lib/albums";
import { gradientFor } from "@/lib/gradient";
import StarRating from "@/components/StarRating";
import DeleteAlbumButton from "@/components/DeleteAlbumButton";
import TrackList from "@/components/TrackList";
import { getAlbumTracks, SpotifyTrack } from "@/lib/spotify";

export default async function AlbumDetailPage({ params }: { params: { id: string } }) {
  const album = await getAlbumById(params.id);

  if (!album) {
    notFound();
  }

  // Spotify 연결이 실패해도 앨범 정보는 보여야 하므로, 수록곡만 빼고 화면을 그린다.
  let tracks: SpotifyTrack[] = [];
  if (album.spotifyId) {
    try {
      tracks = await getAlbumTracks(album.spotifyId);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← 목록으로
      </Link>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-8">
        {album.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.coverImageUrl}
            alt={album.title}
            className="aspect-square w-full rounded-xl object-cover"
          />
        ) : (
          <div className={`aspect-square rounded-xl bg-gradient-to-b ${gradientFor(album.id)}`} />
        )}

        <div>
          <h1 className="text-2xl font-bold text-gray-900">{album.title}</h1>
          <p className="text-gray-500 mt-1 pb-4 border-b border-gray-100">{album.artist}</p>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">발매일</dt>
              <dd className="text-gray-900">{album.releaseDate || "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">평점</dt>
              <dd>
                <StarRating rating={album.rating} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">장르</dt>
              <dd className="text-gray-900">{album.genre || "-"}</dd>
            </div>
          </dl>

          <div className="mt-4 flex gap-2">
            <Link
              href={`/albums/${album.id}/edit`}
              className="rounded-lg border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              수정
            </Link>
            <DeleteAlbumButton albumId={album.id} />
          </div>

          {album.spotifyUrl && (
            <a
              href={album.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-lg bg-[#1DB954] text-white text-sm font-medium px-4 py-2 hover:bg-[#1aa34a] transition-colors"
            >
              Spotify에서 듣기
            </a>
          )}
        </div>
      </div>

      {album.spotifyId && tracks.length > 0 && (
        <TrackList
          albumId={album.id}
          albumSpotifyId={album.spotifyId}
          tracks={tracks}
          initialFavoriteIds={album.favoriteTrackIds ?? []}
        />
      )}
    </main>
  );
}
