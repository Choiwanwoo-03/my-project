"use client";

export default function GenreFilter({
  genres,
  defaultValue,
}: {
  genres: string[];
  defaultValue: string;
}) {
  return (
    <select
      name="genre"
      defaultValue={defaultValue}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
    >
      <option value="">전체 장르</option>
      {genres.map((genre) => (
        <option key={genre} value={genre}>
          {genre}
        </option>
      ))}
    </select>
  );
}
