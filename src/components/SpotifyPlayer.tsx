"use client";

import { createContext, useContext, useRef, useState } from "react";

type NowPlaying = { trackName: string; artistName: string; paused: boolean };

const NOT_CONNECTED = "NOT_CONNECTED";
const SDK_URL = "https://sdk.scdn.co/spotify-player.js";

const PlayAlbumContext = createContext<(albumSpotifyId: string, position?: number) => void>(
  () => {}
);

export function usePlayAlbum() {
  return useContext(PlayAlbumContext);
}

async function fetchAccessToken(): Promise<string> {
  const res = await fetch("/api/spotify/token");
  if (res.status === 404) {
    throw new Error(NOT_CONNECTED);
  }
  if (!res.ok) {
    throw new Error("Spotify 토큰을 받지 못했습니다.");
  }
  const data = await res.json();
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

  // 플레이어는 처음 재생할 때 한 번만 만들고, 이후에는 같은 기기(device)를 계속 쓴다.
  function getDeviceId(): Promise<string> {
    deviceIdRef.current ??= loadSdk()
      .then(
        () =>
          new Promise<string>((resolve, reject) => {
            const player = new window.Spotify!.Player({
              name: "내 앨범 기록",
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
                trackName: track.name,
                artistName: track.artists.map((a) => a.name).join(", "),
                paused: state.paused,
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
      setMessage(error instanceof Error ? error.message : "재생에 실패했습니다.");
    }
  }

  const isBarVisible = nowPlaying !== null || message !== "" || notConnected;
  const controlClass =
    "w-9 h-9 rounded-full text-gray-700 hover:bg-gray-100 transition-colors text-lg leading-none";

  return (
    <PlayAlbumContext.Provider value={playAlbum}>
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
              ) : message ? (
                <span className="text-red-600">{message}</span>
              ) : (
                nowPlaying && (
                  <>
                    <p className="font-medium text-gray-900 truncate">{nowPlaying.trackName}</p>
                    <p className="text-gray-500 truncate">{nowPlaying.artistName}</p>
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
    </PlayAlbumContext.Provider>
  );
}
