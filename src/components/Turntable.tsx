"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePlayer } from "@/components/SpotifyPlayer";
import { useAlbumColor, darken } from "@/lib/albumColor";

// LP 표면의 가는 홈(groove)을 동심원 무늬로 표현한다. 앨범 색이 있으면 아주 어둡게 물들이고
// (실제 비닐처럼 거의 검게 보이되 은은한 색감만 남게), 없으면 기본 검정/회색 홈을 쓴다.
function vinylGrooves(albumColor: string | null): string {
  if (!albumColor) {
    return "repeating-radial-gradient(circle at center, #111 0px, #111 2px, #1d1d1d 3px, #111 4px)";
  }
  const groove = darken(albumColor, 0.08);
  const ridge = darken(albumColor, 0.14);
  return `repeating-radial-gradient(circle at center, rgb(${groove}) 0px, rgb(${groove}) 2px, rgb(${ridge}) 3px, rgb(${groove}) 4px)`;
}

// 판 위의 빛 반사. 판과 같이 돌면 어색해서 회전하지 않는 별도 층으로 둔다.
const VINYL_SHEEN =
  "conic-gradient(from 30deg, transparent 0deg, rgba(255,255,255,0.09) 40deg, transparent 90deg, transparent 180deg, rgba(255,255,255,0.06) 220deg, transparent 270deg)";

// 톤암 각도(도). 0도는 판 밖에서 쉬는 위치이고, 판 바깥(20도)이 곡의 처음, 안쪽(40도)이 곡의 끝이다.
const ARM_REST = 0;
const ARM_START = 20;
const ARM_END = 40;
// 손으로 끌 때 움직일 수 있는 범위
const ARM_MIN = -10;
const ARM_MAX = 44;

const SEEK_STEP_MS = 5000;
const VOLUME_STEP = 0.1;

type Size = "compact" | "large";

// 크기별로 달라지는 치수·글자 크기만 여기 모아 둔다. 턴테이블 동작 로직은 크기와 무관하게 하나다.
const SIZE_CONFIG: Record<
  Size,
  {
    housing: string;
    vinylInset: string;
    tonearmBase: string;
    knob: string;
    stem: string;
    headshell: string;
    // 톤암 축 위치를 턴테이블 실제 렌더링 크기에 대한 비율(0~1)로 잡는다 — 화면 폭에 따라 커지는
    // compact 크기에서도 축이 항상 손잡이 위치와 맞게 하기 위함.
    pivotRatioX: number;
    pivotRatioY: number;
    toast: string;
    infoWrap: string;
    title: string;
    artist: string;
    album: string;
    controlsWrap: string;
    sideButton: string;
    playButton: string;
    emptyWrap: string;
    emptyHint: string;
  }
> = {
  compact: {
    // 고정 크기 대신 부모(좌측 LP 패널) 너비에 비례해서 커진다. 92%로 둬서 카드 안쪽에 자연스러운
    // 여백이 남고, max-w로 과도하게 커지는 것만 막는다(패널을 끝까지 넓혀도 음반이 화면을 집어삼키지 않게).
    housing:
      "relative mx-auto w-[92%] max-w-lg aspect-square rounded-3xl bg-gradient-to-br from-neutral-800 to-neutral-900 shadow-xl ring-1 ring-white/10",
    vinylInset: "absolute inset-[8%]",
    tonearmBase: "absolute right-[8%] top-[8%] h-[78%] w-3.5",
    knob: "absolute -left-2.5 -top-2.5 h-9 w-9 rounded-full bg-neutral-400 ring-4 ring-neutral-600",
    stem: "absolute left-1/2 top-0 h-full w-2 -translate-x-1/2 rounded-full bg-gradient-to-b from-neutral-300 to-neutral-400",
    headshell: "absolute bottom-0 left-1/2 h-8 w-5 -translate-x-1/2 translate-y-2 rounded-sm bg-neutral-300",
    pivotRatioX: 0.118,
    pivotRatioY: 0.09,
    toast: "pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs",
    infoWrap: "mt-6 text-center",
    title: "truncate text-base font-bold",
    artist: "mt-0.5 truncate text-sm text-white/70",
    album: "truncate text-xs text-white/40",
    controlsWrap: "mt-5 flex items-center justify-center gap-5",
    sideButton: "h-10 w-10 rounded-full text-xl leading-none hover:bg-white/10",
    playButton:
      "h-14 w-14 rounded-full bg-white text-xl leading-none text-neutral-900 transition-transform hover:scale-105",
    emptyWrap: "mt-6 text-center text-sm text-white/60",
    emptyHint: "mt-1 text-white/40",
  },
  large: {
    housing:
      "relative mx-auto h-[22rem] w-[22rem] rounded-3xl bg-gradient-to-br from-neutral-800 to-neutral-900 shadow-2xl ring-1 ring-white/10 sm:h-[26rem] sm:w-[26rem]",
    vinylInset: "absolute left-6 top-6 h-[17rem] w-[17rem] sm:h-[20rem] sm:w-[20rem]",
    tonearmBase: "absolute right-8 top-8 h-[15rem] w-4 sm:h-[18rem]",
    knob: "absolute -left-3 -top-3 h-10 w-10 rounded-full bg-neutral-400 ring-4 ring-neutral-600",
    stem: "absolute left-1/2 top-0 h-full w-1.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-neutral-300 to-neutral-400",
    headshell: "absolute bottom-0 left-1/2 h-8 w-5 -translate-x-1/2 translate-y-2 rounded-sm bg-neutral-300",
    pivotRatioX: 0.114,
    pivotRatioY: 0.091,
    toast: "pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-1.5 text-sm",
    infoWrap: "mx-auto mt-8 w-full max-w-md text-center",
    title: "truncate text-xl font-bold",
    artist: "mt-1 truncate text-white/70",
    album: "truncate text-sm text-white/40",
    controlsWrap: "mt-6 flex items-center justify-center gap-6",
    sideButton: "h-12 w-12 rounded-full text-2xl leading-none hover:bg-white/10",
    playButton:
      "h-16 w-16 rounded-full bg-white text-2xl leading-none text-neutral-900 transition-transform hover:scale-105",
    emptyWrap: "mt-8 text-center text-white/70",
    emptyHint: "mt-1 text-sm text-white/50",
  },
};

export default function Turntable({
  size,
  emptyStateExtra,
}: {
  size: Size;
  // 재생 중인 곡이 없을 때, 안내 문구 아래에 추가로 보여줄 내용(예: 목록으로 가는 링크).
  emptyStateExtra?: React.ReactNode;
}) {
  const { nowPlaying, togglePlay, nextTrack, previousTrack, resume, pause, seek, changeVolume } =
    usePlayer();
  const [now, setNow] = useState(() => Date.now());
  const turntableRef = useRef<HTMLDivElement>(null);
  const cfg = SIZE_CONFIG[size];

  // 재생 중인 앨범 커버에서 뽑은 색으로 턴테이블 몸체를 물들인다. 색을 못 뽑으면 기본 회색 그대로.
  const albumColor = useAlbumColor(nowPlaying?.coverUrl);
  const housingStyle = albumColor
    ? {
        backgroundImage: `linear-gradient(to bottom right, rgb(${darken(albumColor, 0.5)}), rgb(${darken(
          albumColor,
          0.2
        )}))`,
      }
    : undefined;

  // 끄는 중인 톤암 각도. 끄지 않을 때는 null.
  const [dragAngle, setDragAngle] = useState<number | null>(null);
  // 판에 내려놓은 각도. Spotify가 새 재생 위치를 알려줄 때까지 그 자리에 둔다.
  const [dropAngle, setDropAngle] = useState<number | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string) => {
    setToast(text);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 1000);
  }, []);

  // 재생 중에는 0.5초마다 다시 그려서 톤암이 곡 진행을 따라 조금씩 안쪽으로 움직이게 한다.
  useEffect(() => {
    if (!nowPlaying || nowPlaying.paused) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [nowPlaying]);

  // 새 재생 상태가 오면(이동 반영 등) 내려놓은 자리 대신 실제 진행 위치를 따라간다.
  useEffect(() => {
    setDropAngle(null);
  }, [nowPlaying]);

  // 키보드 조작: 스페이스 재생/일시정지, ←→ 5초 이동, ↑↓ 볼륨
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!nowPlaying) return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea")) return;

      const currentMs = nowPlaying.paused
        ? nowPlaying.positionMs
        : nowPlaying.positionMs + (Date.now() - nowPlaying.updatedAt);

      if (e.code === "Space") {
        // 키보드로 버튼에 초점을 둔 경우에는 그 버튼의 원래 동작을 따른다.
        if (target.closest("button, a")) return;
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        seek(Math.max(0, currentMs - SEEK_STEP_MS));
        showToast("-5초");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        seek(Math.min(nowPlaying.durationMs, currentMs + SEEK_STEP_MS));
        showToast("+5초");
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        changeVolume(e.key === "ArrowUp" ? VOLUME_STEP : -VOLUME_STEP).then((volume) =>
          showToast(`볼륨 ${Math.round(volume * 100)}%`)
        );
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nowPlaying, togglePlay, seek, changeVolume, showToast]);

  const isPlaying = nowPlaying !== null && !nowPlaying.paused;
  const elapsedSinceUpdate = isPlaying ? Math.max(0, now - nowPlaying.updatedAt) : 0;
  const positionMs = nowPlaying
    ? Math.min(nowPlaying.durationMs, nowPlaying.positionMs + elapsedSinceUpdate)
    : 0;
  const progress = nowPlaying && nowPlaying.durationMs > 0 ? positionMs / nowPlaying.durationMs : 0;
  const progressAngle = ARM_START + (ARM_END - ARM_START) * progress;
  const armAngle = dragAngle ?? dropAngle ?? (isPlaying ? progressAngle : ARM_REST);

  // 마우스 위치를 톤암 각도로 바꾼다. 톤암 축은 턴테이블 오른쪽 위 모서리에서 안쪽에 있다.
  function angleFromPointer(clientX: number, clientY: number): number {
    const rect = turntableRef.current!.getBoundingClientRect();
    const pivotX = rect.right - rect.width * cfg.pivotRatioX;
    const pivotY = rect.top + rect.height * cfg.pivotRatioY;
    const degrees = (Math.atan2(pivotX - clientX, clientY - pivotY) * 180) / Math.PI;
    return Math.min(ARM_MAX, Math.max(ARM_MIN, degrees));
  }

  async function handleDrop(angle: number) {
    if (!nowPlaying) return;

    if (angle < ARM_START - 2) {
      // 판 밖에 내려놓으면 바늘을 든 것처럼 멈춘다.
      if (!nowPlaying.paused) await pause();
      return;
    }

    // 실제 턴테이블처럼 바늘을 놓은 자리(바깥 = 처음, 안쪽 = 끝)부터 재생한다.
    const clamped = Math.min(ARM_END, Math.max(ARM_START, angle));
    setDropAngle(clamped);
    const ratio = (clamped - ARM_START) / (ARM_END - ARM_START);
    await seek(ratio * nowPlaying.durationMs);
    if (nowPlaying.paused) await resume();
  }

  return (
    <div>
      {/* 턴테이블 본체 */}
      <div ref={turntableRef} className={cfg.housing} style={housingStyle}>
        <div className={cfg.vinylInset}>
          <div
            className="vinyl-spin relative h-full w-full rounded-full shadow-xl"
            style={{
              background: vinylGrooves(albumColor),
              animationPlayState: isPlaying ? "running" : "paused",
            }}
          >
            {/* 가운데 라벨: 앨범 커버 */}
            <div className="absolute inset-[33%] overflow-hidden rounded-full bg-neutral-700 ring-4 ring-black/40">
              {nowPlaying?.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={nowPlaying.coverUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-300" />
          </div>
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ background: VINYL_SHEEN }}
          />
        </div>

        {/* 톤암: 위쪽 축을 중심으로 돈다. 재생 중인 곡이 있으면 잡아서 끌 수 있다. */}
        <div
          onPointerDown={(e) => {
            if (!nowPlaying) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragAngle(armAngle);
          }}
          onPointerMove={(e) => {
            if (dragAngle === null) return;
            setDragAngle(angleFromPointer(e.clientX, e.clientY));
          }}
          onPointerUp={(e) => {
            // 명시적으로 풀어주지 않으면 포인터가 톤암에 계속 붙잡혀 있어서, 이후 다른 버튼
            // 클릭이 전달되지 않는 경우가 있다.
            e.currentTarget.releasePointerCapture(e.pointerId);
            if (dragAngle === null) return;
            handleDrop(angleFromPointer(e.clientX, e.clientY));
            setDragAngle(null);
          }}
          onPointerCancel={(e) => {
            e.currentTarget.releasePointerCapture(e.pointerId);
            setDragAngle(null);
          }}
          className={`${cfg.tonearmBase} origin-top touch-none ${
            dragAngle === null ? "transition-transform duration-1000 ease-in-out" : ""
          } ${nowPlaying ? (dragAngle === null ? "cursor-grab" : "cursor-grabbing") : ""}`}
          style={{ transform: `rotate(${armAngle}deg)` }}
        >
          <div className={cfg.knob} />
          <div className={cfg.stem} />
          <div className={cfg.headshell} />
        </div>

        {toast && <div className={cfg.toast}>{toast}</div>}
      </div>

      {nowPlaying ? (
        <div className={cfg.infoWrap}>
          <p className={cfg.title}>{nowPlaying.trackName}</p>
          <p className={cfg.artist}>{nowPlaying.artistName}</p>
          <p className={cfg.album}>{nowPlaying.albumName}</p>

          {/* 버튼을 마우스로 눌러도 초점이 남지 않게 해서, 그 뒤에도 스페이스바가 재생/일시정지로 동작하게 한다. */}
          <div className={cfg.controlsWrap}>
            <button
              type="button"
              aria-label="이전 곡"
              onMouseDown={(e) => e.preventDefault()}
              onClick={previousTrack}
              className={cfg.sideButton}
            >
              ⏮
            </button>
            <button
              type="button"
              aria-label={nowPlaying.paused ? "재생" : "일시정지"}
              onMouseDown={(e) => e.preventDefault()}
              onClick={togglePlay}
              className={cfg.playButton}
            >
              {nowPlaying.paused ? "▶" : "⏸"}
            </button>
            <button
              type="button"
              aria-label="다음 곡"
              onMouseDown={(e) => e.preventDefault()}
              onClick={nextTrack}
              className={cfg.sideButton}
            >
              ⏭
            </button>
          </div>
        </div>
      ) : (
        <div className={cfg.emptyWrap}>
          <p>지금 재생 중인 곡이 없어요.</p>
          <p className={cfg.emptyHint}>앨범 상세에서 ▶ 전체 재생을 눌러보세요.</p>
          {emptyStateExtra}
        </div>
      )}
    </div>
  );
}
