export default function Bars({ data, labelKey = 'label', title }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <ul aria-label={title} className="space-y-2">
      {data.map((d) => (
        <li key={d[labelKey]} className="grid grid-cols-[minmax(6rem,9.5rem)_1fr_2.5rem] items-center gap-2 text-sm">
          <span className="truncate" title={d[labelKey]}>{d[labelKey]}</span>
          <span className="h-3 rounded-full bg-slate-100 print:border print:border-slate-300"><span className="block h-3 rounded-full bg-brand-600 print:bg-slate-700" style={{ width: `${(d.count / max) * 100}%` }} /></span>
          <span className="text-right font-medium">{d.count}</span>
        </li>
      ))}
    </ul>
  )
}
