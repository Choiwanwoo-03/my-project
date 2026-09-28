import { notFound } from "next/navigation";
import { getAlbumById } from "@/lib/albums";
import EditAlbumForm from "@/components/EditAlbumForm";

export default async function EditAlbumPage({ params }: { params: { id: string } }) {
  const album = await getAlbumById(params.id);

  if (!album) {
    notFound();
  }

  return <EditAlbumForm album={album} />;
}
