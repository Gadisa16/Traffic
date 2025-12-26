export default function Spinner({ size = 5 }: { size?: number }) {
  const s = `${size}rem`
  return (
    <svg className="animate-spin" width={size * 4} height={size * 4} viewBox="0 0 24 24" fill="none" style={{ width: s, height: s }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="text-gray-200" strokeOpacity="0.6" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" className="text-blue-600" strokeLinecap="round" />
    </svg>
  )
}
