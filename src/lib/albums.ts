import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { Album } from "@/types/album";

export async function getAlbumById(id: string): Promise<Album | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const db = await getDb();
  const doc = await db.collection("albums").findOne({ _id: new ObjectId(id) });

  if (!doc) {
    return null;
  }

  return {
    id: doc._id.toString(),
    title: doc.title,
    artist: doc.artist,
    releaseDate: doc.releaseDate,
    rating: doc.rating,
    genre: doc.genre,
    coverImageUrl: doc.coverImageUrl,
    spotifyId: doc.spotifyId,
    spotifyUrl: doc.spotifyUrl,
  };
}
