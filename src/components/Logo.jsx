export default function Logo({ className = 'h-9', showText = true }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#1d4ed8" />
        <path d="M13 7h6v6h6v6h-6v6h-6v-6H7v-6h6z" fill="#fff" />
      </svg>
      {showText && <span className="text-xl font-bold tracking-tight text-brand-900">eClinic</span>}
    </span>
  )
}
