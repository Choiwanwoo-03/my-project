"use client";

export default function SortSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select
      name="sort"
      defaultValue={defaultValue}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
    >
      <option value="">최신 등록순</option>
      <option value="rating">평점 높은순</option>
      <option value="releaseDate">발매일 최신순</option>
    </select>
  );
}
