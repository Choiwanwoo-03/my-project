"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteAlbumButton({
  albumId,
  onDeleted,
}: {
  albumId: string;
  // 삭제된 앨범은 더 이상 모달에 보여줄 수 없으니, 호출한 쪽에서 모달을 닫도록 알려준다.
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    const res = await fetch(`/api/albums/${albumId}`, { method: "DELETE" });

    if (!res.ok) {
      setError(
        res.status === 401
          ? "잠금이 걸려 있어 삭제할 수 없습니다. 재생 잠금을 먼저 해제하세요."
          : "삭제에 실패했습니다. 다시 시도해 주세요."
      );
      return;
    }

    // 예전엔 window.location.href로 완전 새로고침을 했는데, 그러면 재생 중이던 음악까지 끊겼다.
    // 삭제도 이제 모달 안에서 끝나는 동작이라 페이지 이동이 필요 없다 — 목록만 다시 불러온다.
    router.refresh();
    onDeleted?.();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">정말 삭제할까요?</span>
        <button
          onClick={handleDelete}
          className="rounded-lg bg-red-600 text-white text-sm font-medium px-4 py-2 hover:bg-red-700 transition-colors"
        >
          삭제
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-red-200 text-red-600 text-sm font-medium px-4 py-2 hover:bg-red-50 transition-colors"
    >
      삭제
    </button>
  );
}
