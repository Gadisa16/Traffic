import Link from 'next/link';

export default function EmptyState({ title, message, cta }: { title?: string; message?: string; cta?: { label: string; href: string } }) {
  return (
    <div className="w-full surface-compact flex flex-col items-center text-center">
      {/* Simple Hawassa / Lake motif SVG */}
      <svg width="220" height="120" viewBox="0 0 220 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4">
        <rect width="220" height="120" rx="10" fill="var(--surface)" />
        <g transform="translate(10,10)">
          <path d="M0 70 C30 50, 60 50, 90 70 C120 90, 150 90, 180 70" stroke="var(--accent)" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <circle cx="30" cy="30" r="6" fill="var(--accent)" opacity="0.9"/>
          <rect x="150" y="20" width="40" height="18" rx="3" fill="var(--accent)" opacity="0.85" />
        </g>
      </svg>

      <h3 className="text-lg font-semibold mb-2">{title || 'No records yet'}</h3>
      <p className="text-sm muted mb-4">{message || 'There are no items to show here. Register the first vehicle to get started.'}</p>
      {cta && (
        <Link href={cta.href} className="btn btn-primary">
          {cta.label}
        </Link>
      )}
    </div>
  )
}
