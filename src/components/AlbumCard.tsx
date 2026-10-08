"use client";

import { useState } from "react";
import { Album } from "@/types/album";
import { gradientFor } from "@/lib/gradient";
import StarRating from "@/components/StarRating";
import AlbumDetailModal from "@/components/AlbumDetailModal";

export default function AlbumCard({ album }: { album: Album }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full text-left rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
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
          <div className="mt-2 text-sm">
            <StarRating rating={album.rating} />
          </div>
        </div>
      </button>
      {open && <AlbumDetailModal albumId={album.id} onClose={() => setOpen(false)} />}
    </>
  );
}
