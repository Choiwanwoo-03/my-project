"use client";

import { useState } from "react";

export default function DeleteAlbumButton({ albumId }: { albumId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    const res = await fetch(`/api/albums/${albumId}`, { method: "DELETE" });

    if (!res.ok) {
      setError("삭제에 실패했습니다. 다시 시도해 주세요.");
      return;
    }

    // router.push + router.refresh 조합이 배포 환경에서 경쟁 상태를 일으켜
    // 완전한 페이지 이동으로 클라이언트 라우터 캐시를 아예 우회한다.
    window.location.href = "/";
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
