"use client";

import { createContext, useContext, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NowPlaying = {
  // 수록곡 목록에서 지금 나오는 곡을 찾을 때 쓰는 곡 ID들
  trackIds: string[];
  trackName: string;
  artistName: string;
  albumName: string;
  coverUrl: string;
  paused: boolean;
  positionMs: number;
  durationMs: number;
  // Spotify가 위치(positionMs)를 알려준 시각. 재생 중이면 지금까지 흐른 시간을 더해 현재 위치를 계산한다.
  updatedAt: number;
};

type PlayerControls = {
  playAlbum: (albumSpotifyId: string, position?: number) => void;
  nowPlaying: NowPlaying | null;
  togglePlay: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  resume: () => Promise<void>;
  pause: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  // 볼륨을 delta(예: +0.1)만큼 바꾸고, 바뀐 볼륨(0~1)을 돌려준다.
  changeVolume: (delta: number) => Promise<number>;
};

const NOT_CONNECTED = "NOT_CONNECTED";
const LOCKED = "LOCKED";
const SDK_URL = "https://sdk.scdn.co/spotify-player.js";

const PlayerContext = createContext<PlayerControls>({
  playAlbum: () => {},
  nowPlaying: null,
  togglePlay: () => {},
  nextTrack: () => {},
  previousTrack: () => {},
  resume: async () => {},
  pause: async () => {},
  seek: async () => {},
  changeVolume: async () => 0,
});

export function usePlayer() {
  return useContext(PlayerContext);
}

export function usePlayAlbum() {
  return useContext(PlayerContext).playAlbum;
}

async function fetchAccessToken(): Promise<string> {
  const res = await fetch("/api/spotify/token");
  if (res.status === 404) {
    throw new Error(NOT_CONNECTED);
  }
  if (res.status === 401) {
    throw new Error(LOCKED);
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Spotify 토큰을 받지 못했습니다.");
  }
  return data.accessToken;
}

// SDK 스크립트는 한 번만 불러온다. 두 번 눌러도 같은 Promise를 돌려준다.
let sdkPromise: Promise<void> | null = null;
function loadSdk(): Promise<void> {
  sdkPromise ??= new Promise((resolve) => {
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const script = document.createElement("script");
    script.src = SDK_URL;
    document.body.appendChild(script);
  });
  return sdkPromise;
}

export default function SpotifyPlayerProvider({ children }: { children: React.ReactNode }) {
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const deviceIdRef = useRef<Promise<string> | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [message, setMessage] = useState("");
  const [notConnected, setNotConnected] = useState(false);
  const [locked, setLocked] = useState(false);
  const [password, setPassword] = useState("");
  // 비밀번호를 입력하고 나면 방금 누른 곡을 이어서 재생하려고 기억해 둔다.
  const pendingPlayRef = useRef<{ albumSpotifyId: string; position: number } | null>(null);

  // 플레이어는 처음 재생할 때 한 번만 만들고, 이후에는 같은 기기(device)를 계속 쓴다.
  function getDeviceId(): Promise<string> {
    deviceIdRef.current ??= loadSdk()
      .then(
        () =>
          new Promise<string>((resolve, reject) => {
            const player = new window.Spotify!.Player({
              name: "바이닐로그",
              getOAuthToken: (callback) => {
                fetchAccessToken().then(callback).catch(() => {});
              },
              volume: 0.5,
            });
            player.addListener("ready", ({ device_id }) => resolve(device_id));
            player.addListener("initialization_error", ({ message }) => reject(new Error(message)));
            player.addListener("authentication_error", ({ message }) => reject(new Error(message)));
            player.addListener("account_error", () =>
              reject(new Error("Spotify Premium 계정이 필요합니다."))
            );
            player.addListener("player_state_changed", (state) => {
              if (!state) {
                setNowPlaying(null);
                return;
              }
              const track = state.track_window.current_track;
              setNowPlaying({
                trackIds: [track.id, track.linked_from?.id].filter(
                  (id): id is string => typeof id === "string"
                ),
                trackName: track.name,
                artistName: track.artists.map((a) => a.name).join(", "),
                albumName: track.album.name,
                coverUrl: track.album.images[0]?.url ?? "",
                paused: state.paused,
                positionMs: state.position,
                durationMs: state.duration,
                updatedAt: Date.now(),
              });
            });
            player.connect();
            playerRef.current = player;
          })
      )
      .catch((error) => {
        // 준비에 실패한 플레이어는 버리고, 다음에 누르면 처음부터 다시 만든다.
        deviceIdRef.current = null;
        playerRef.current?.disconnect();
        playerRef.current = null;
        throw error;
      });
    return deviceIdRef.current;
  }

  async function requestPlay(token: string, deviceId: string, albumSpotifyId: string, position: number) {
    return fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ context_uri: `spotify:album:${albumSpotifyId}`, offset: { position } }),
    });
  }

  async function playAlbum(albumSpotifyId: string, position = 0) {
    pendingPlayRef.current = { albumSpotifyId, position };
    setMessage("");
    setNotConnected(false);
    try {
      const token = await fetchAccessToken();
      const deviceId = await getDeviceId();
      let res = await requestPlay(token, deviceId, albumSpotifyId, position);
      // 플레이어가 막 준비된 직후에는 Spotify가 기기를 아직 모를 때가 있어 1초 뒤 한 번 더 시도한다.
      if (res.status === 404) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        res = await requestPlay(token, deviceId, albumSpotifyId, position);
      }
      if (!res.ok) {
        throw new Error(`재생 요청이 실패했습니다. (${res.status})`);
      }
    } catch (error) {
      if (error instanceof Error && error.message === NOT_CONNECTED) {
        setNotConnected(true);
        return;
      }
      if (error instanceof Error && error.message === LOCKED) {
        setLocked(true);
        return;
      }
      setMessage(error instanceof Error ? error.message : "재생에 실패했습니다.");
    }
  }

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/spotify/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "잠금 해제에 실패했습니다.");
      return;
    }

    setLocked(false);
    setPassword("");
    const pending = pendingPlayRef.current;
    if (pending) {
      playAlbum(pending.albumSpotifyId, pending.position);
    }
  }

  const controls: PlayerControls = {
    playAlbum,
    nowPlaying,
    togglePlay: () => playerRef.current?.togglePlay(),
    nextTrack: () => playerRef.current?.nextTrack(),
    previousTrack: () => playerRef.current?.previousTrack(),
    resume: async () => {
      await playerRef.current?.resume();
    },
    pause: async () => {
      await playerRef.current?.pause();
    },
    seek: async (positionMs) => {
      await playerRef.current?.seek(Math.round(positionMs));
    },
    changeVolume: async (delta) => {
      const player = playerRef.current;
      if (!player) return 0;
      const next = Math.min(1, Math.max(0, (await player.getVolume()) + delta));
      await player.setVolume(next);
      return next;
    },
  };

  // 메인 화면(좌측 LP 패널)과 LP 화면은 자체 조작 버튼이 있어서 아래 바를 숨긴다.
  const pathname = usePathname();
  const isBarVisible =
    pathname !== "/" &&
    pathname !== "/player" &&
    (nowPlaying !== null || message !== "" || notConnected || locked);
  const controlClass =
    "w-9 h-9 rounded-full text-gray-700 hover:bg-gray-100 transition-colors text-lg leading-none";

  return (
    <PlayerContext.Provider value={controls}>
      <div className={isBarVisible ? "pb-20" : ""}>{children}</div>

      {isBarVisible && (
        <div className="fixed bottom-0 inset-x-0 border-t border-gray-200 bg-white/95 backdrop-blur">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
            <div className="flex-1 min-w-0 text-sm">
              {notConnected ? (
                <span className="text-gray-600">
                  Spotify 계정이 아직 연결되지 않았습니다.{" "}
                  <a href="/api/spotify/login" className="font-medium text-[#1DB954] hover:underline">
                    연결하기
                  </a>
                </span>
              ) : locked ? (
                <form onSubmit={handleUnlock} className="flex flex-wrap items-center gap-2">
                  <span className="text-gray-600">재생하려면 비밀번호를 입력하세요.</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                    className="w-40 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-[#1DB954] text-white text-sm font-medium px-3 py-1.5 hover:bg-[#1aa34a] transition-colors"
                  >
                    확인
                  </button>
                  {message && <span className="text-red-600">{message}</span>}
                </form>
              ) : message ? (
                <span className="text-red-600">{message}</span>
              ) : (
                nowPlaying && (
                  <>
                    <p className="font-medium text-gray-900 truncate">{nowPlaying.trackName}</p>
                    <p className="text-gray-500 truncate">
                      {nowPlaying.artistName} ·{" "}
                      <Link href="/player" className="font-medium text-[#1DB954] hover:underline">
                        LP로 보기
                      </Link>
                    </p>
                  </>
                )
              )}
            </div>

            {nowPlaying && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="이전 곡"
                  onClick={() => playerRef.current?.previousTrack()}
                  className={controlClass}
                >
                  ⏮
                </button>
                <button
                  type="button"
                  aria-label={nowPlaying.paused ? "재생" : "일시정지"}
                  onClick={() => playerRef.current?.togglePlay()}
                  className="w-10 h-10 rounded-full bg-[#1DB954] text-white hover:bg-[#1aa34a] transition-colors text-lg leading-none"
                >
                  {nowPlaying.paused ? "▶" : "⏸"}
                </button>
                <button
                  type="button"
                  aria-label="다음 곡"
                  onClick={() => playerRef.current?.nextTrack()}
                  className={controlClass}
                >
                  ⏭
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </PlayerContext.Provider>
  );
}
