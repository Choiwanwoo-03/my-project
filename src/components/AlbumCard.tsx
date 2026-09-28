import Link from "next/link";
import { Album } from "@/types/album";
import { gradientFor } from "@/lib/gradient";
import { STATUS_STYLES } from "@/lib/status-styles";
import StarRating from "@/components/StarRating";

export default function AlbumCard({ album }: { album: Album }) {
  return (
    <Link
      href={`/albums/${album.id}`}
      className="block rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {album.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={album.coverImageUrl}
          alt={album.title}
          className="aspect-square w-full object-cover"
        />
      ) : (
        <div className={`aspect-square bg-gradient-to-b ${gradientFor(album.id)}`} />
      )}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">{album.title}</h3>
        <p className="text-sm text-gray-500 truncate">{album.artist}</p>
        <div className="mt-2 flex items-center justify-between text-sm">
          <StarRating rating={album.rating} />
          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[album.status]}`}>
            {album.status}
          </span>
        </div>
      </div>
    </Link>
  );
}
