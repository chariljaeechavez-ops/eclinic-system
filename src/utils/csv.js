// Quotes every cell; neutralizes spreadsheet formula injection (cells starting with = + - @ or tab/CR).
const cell = (v) => {
  let s = v == null ? '' : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

export function toCsv(rows, columns) {
  const head = columns.map((c) => cell(c.label)).join(',')
  return [head, ...rows.map((r) => columns.map((c) => cell(c.get(r))).join(','))].join('\r\n')
}

export function downloadCsv(filename, csv) {
  const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
}
