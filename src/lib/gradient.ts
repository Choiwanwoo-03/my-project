const GRADIENTS = [
  "from-slate-300 to-slate-700",
  "from-yellow-100 to-green-700",
  "from-gray-900 to-green-600",
  "from-blue-600 to-slate-900",
  "from-red-800 to-amber-500",
  "from-gray-500 to-green-900",
];

export function gradientFor(id: string) {
  const index = id.charCodeAt(0) % GRADIENTS.length;
  return GRADIENTS[index];
}
