export default function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 tracking-tight">
      {Array.from({ length: 5 }, (_, i) => (i < rating ? "★" : "☆")).join("")}
    </span>
  );
}
