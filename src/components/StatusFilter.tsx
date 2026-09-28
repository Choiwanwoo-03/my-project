"use client";

export default function StatusFilter({ defaultValue }: { defaultValue: string }) {
  return (
    <select
      name="status"
      defaultValue={defaultValue}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
    >
      <option value="">전체 상태</option>
      <option value="듣는중">듣는중</option>
      <option value="다들음">다들음</option>
      <option value="인생앨범">인생앨범</option>
    </select>
  );
}
