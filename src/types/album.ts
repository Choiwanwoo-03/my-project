export type AlbumStatus = "듣는중" | "다들음" | "인생앨범";

export interface Album {
  id: string;
  title: string;
  artist: string;
  releaseDate: string;
  rating: number;
  status: AlbumStatus;
  genre?: string;
  coverImageUrl?: string;
}
