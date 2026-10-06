// Spotify Web Playback SDK(브라우저에서 불러오는 스크립트) 중 이 앱이 쓰는 부분만 타입으로 적어 둔다.

interface SpotifyPlayerState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: {
      name: string;
      artists: { name: string }[];
      album: { name: string; images: { url: string }[] };
    };
  };
}

interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  togglePlay(): Promise<void>;
  resume(): Promise<void>;
  pause(): Promise<void>;
  seek(positionMs: number): Promise<void>;
  getVolume(): Promise<number>;
  setVolume(volume: number): Promise<void>;
  nextTrack(): Promise<void>;
  previousTrack(): Promise<void>;
  addListener(event: "ready" | "not_ready", callback: (data: { device_id: string }) => void): boolean;
  addListener(
    event: "player_state_changed",
    callback: (state: SpotifyPlayerState | null) => void
  ): boolean;
  addListener(
    event: "initialization_error" | "authentication_error" | "account_error" | "playback_error",
    callback: (error: { message: string }) => void
  ): boolean;
}

interface Window {
  onSpotifyWebPlaybackSDKReady?: () => void;
  Spotify?: {
    Player: new (options: {
      name: string;
      getOAuthToken: (callback: (token: string) => void) => void;
      volume?: number;
    }) => SpotifyPlayer;
  };
}
