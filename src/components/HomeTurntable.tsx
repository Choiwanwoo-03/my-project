import Link from "next/link";
import Turntable from "@/components/Turntable";

export default function HomeTurntable() {
  return (
    <div className="relative rounded-2xl bg-neutral-950 p-6 text-white shadow-xl">
      <Link
        href="/player"
        aria-label="크게 보기"
        className="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white"
      >
        ⤢
      </Link>
      <Turntable size="compact" />
    </div>
  );
}
