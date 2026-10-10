"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
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
// 새로고침·탭 닫기 전 재생 상태를 기억해 뒀다가, 다시 들어오면 그 자리부터 이어서 들을 수 있게 한다.
const RESUME_STORAGE_KEY = "vinylog:resume";

type ResumeSnapshot = {
  trackId: string;
  trackName: string;
  artistName: string;
  albumName: string;
  coverUrl: string;
  positionMs: number;
  durationMs: number;
};

function loadResumeSnapshot(): ResumeSnapshot | null {
  try {
    const raw = localStorage.getItem(RESUME_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ResumeSnapshot) : null;
  } catch {
    return null;
  }
}

function saveResumeSnapshot(snapshot: ResumeSnapshot | null) {
  try {
    if (snapshot) {
      localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(snapshot));
    } else {
      localStorage.removeItem(RESUME_STORAGE_KEY);
    }
  } catch {
    // 저장 공간을 못 쓰는 환경(시크릿 모드 등)이면 이어 듣기는 그냥 포기한다.
  }
}

// 비밀번호 잠금 때문에 미뤄둔 재생 요청. 새 앨범 재생이었는지, 이전 재생 이어 듣기였는지 구분해 둔다.
type PendingPlay =
  | { kind: "album"; albumSpotifyId: string; position: number }
  | { kind: "resume"; snapshot: ResumeSnapshot };

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
  // 비밀번호를 입력하고 나면 방금 누른 곡(또는 이어 듣기)을 재생하려고 기억해 둔다.
  const pendingPlayRef = useRef<PendingPlay | null>(null);
  // 새로고침 직후 기기가 다시 연결되기 전까지 보여줄, 직전 재생 상태의 스냅샷.
  // 실제 SDK 상태가 한 번이라도 들어오면 null로 비운다(더 이상 '이어 듣기 대기' 상태가 아니므로).
  const resumeSnapshotRef = useRef<ResumeSnapshot | null>(null);

  // 페이지를 새로 열면 직전에 듣던 곡 정보를 화면에 먼저 보여준다(실제 재생은 사용자가 ▶을 눌러야 시작됨 —
  // 브라우저 자동재생 정책 때문에도 그렇고, 돌아오자마자 소리가 나는 건 당황스러우니까).
  useEffect(() => {
    const snapshot = loadResumeSnapshot();
    if (!snapshot) return;
    resumeSnapshotRef.current = snapshot;
    setNowPlaying({
      trackIds: [snapshot.trackId],
      trackName: snapshot.trackName,
      artistName: snapshot.artistName,
      albumName: snapshot.albumName,
      coverUrl: snapshot.coverUrl,
      paused: true,
      positionMs: snapshot.positionMs,
      durationMs: snapshot.durationMs,
      updatedAt: Date.now(),
    });
  }, []);

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
                saveResumeSnapshot(null);
                return;
              }
              // 실제 SDK 상태가 들어왔으니 더 이상 '이어 듣기 대기' 상태가 아니다.
              resumeSnapshotRef.current = null;
              const track = state.track_window.current_track;
              const trackName = track.name;
              const artistName = track.artists.map((a) => a.name).join(", ");
              const albumName = track.album.name;
              const coverUrl = track.album.images[0]?.url ?? "";
              setNowPlaying({
                trackIds: [track.id, track.linked_from?.id].filter(
                  (id): id is string => typeof id === "string"
                ),
                trackName,
                artistName,
                albumName,
                coverUrl,
                paused: state.paused,
                positionMs: state.position,
                durationMs: state.duration,
                updatedAt: Date.now(),
              });
              // 곡 ID가 없으면(로컬 파일 등 드문 경우) 이어 듣기 URI를 만들 수 없으니 그냥 건너뛴다.
              if (track.id) {
                saveResumeSnapshot({
                  trackId: track.id,
                  trackName,
                  artistName,
                  albumName,
                  coverUrl,
                  positionMs: state.position,
                  durationMs: state.duration,
                });
              }
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

  // 앨범 전체가 아니라 그 곡 하나를, 저장해 둔 위치(ms)부터 바로 재생한다 — 이어 듣기 전용.
  async function requestResume(token: string, deviceId: string, snapshot: ResumeSnapshot) {
    return fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        uris: [`spotify:track:${snapshot.trackId}`],
        position_ms: snapshot.positionMs,
      }),
    });
  }

  async function playAlbum(albumSpotifyId: string, position = 0) {
    // 새 앨범을 트는 거니까, 혹시 남아있던 이어 듣기 스냅샷은 더 이상 의미가 없다.
    resumeSnapshotRef.current = null;
    pendingPlayRef.current = { kind: "album", albumSpotifyId, position };
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

  async function resumeFromSnapshot(snapshot: ResumeSnapshot) {
    pendingPlayRef.current = { kind: "resume", snapshot };
    setMessage("");
    setNotConnected(false);
    try {
      const token = await fetchAccessToken();
      const deviceId = await getDeviceId();
      let res = await requestResume(token, deviceId, snapshot);
      if (res.status === 404) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        res = await requestResume(token, deviceId, snapshot);
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
    if (pending?.kind === "album") {
      playAlbum(pending.albumSpotifyId, pending.position);
    } else if (pending?.kind === "resume") {
      resumeFromSnapshot(pending.snapshot);
    }
  }

  const controls: PlayerControls = {
    playAlbum,
    nowPlaying,
    togglePlay: () => {
      // 기기가 아직 안 붙어 있고(새로고침 직후) 이어 들을 스냅샷이 있으면, 그 자리부터 재생을 시작한다.
      if (resumeSnapshotRef.current) {
        resumeFromSnapshot(resumeSnapshotRef.current);
        return;
      }
      playerRef.current?.togglePlay();
    },
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
                  onClick={controls.togglePlay}
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
