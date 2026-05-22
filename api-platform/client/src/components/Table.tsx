import type { ReactNode } from 'react'

interface Column {
  key: string
  header: string
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode
  className?: string
}

interface TableProps {
  columns: Column[]
  data: Record<string, unknown>[]
  onRowClick?: (row: Record<string, unknown>) => void
  className?: string
}

export default function Table({ columns, data, onRowClick, className = '' }: TableProps) {
  return (
    <div className={`w-full overflow-x-auto scrollbar-thin ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-surface-2">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className={`border-t border-hairline transition-colors duration-150 ${
                i % 2 === 0 ? 'bg-surface-1' : 'bg-canvas'
              } ${onRowClick ? 'hover:bg-surface-2 cursor-pointer' : 'hover:bg-surface-1'}`}
              onClick={() => onRowClick?.(row)}
              onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter') onRowClick(row) } : undefined}
              tabIndex={onRowClick ? 0 : undefined}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 text-sm ${col.className ?? ''}`}
                >
                  {col.render ? col.render(row[col.key], row) : (row[col.key] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
