export interface Album {
  id: string;
  title: string;
  artist: string;
  releaseDate: string;
  rating: number;
  genre?: string;
  coverImageUrl?: string;
  spotifyId?: string;
  spotifyUrl?: string;
}
