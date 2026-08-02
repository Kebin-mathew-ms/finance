import React from 'react';

const Table = ({
  headers = [],
  items = [],
  renderRow,
  page = 1,
  pages = 1,
  onPageChange,
  totalCount = 0,
  loading = false,
  emptyMessage = "No records found."
}) => {
  return (
    <div className="flex flex-col w-full">
      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-white/5 bg-zinc-950/40">
        <table className="min-w-full divide-y divide-white/5">
          <thead className="bg-zinc-900/50">
            <tr>
              {headers.map((hdr, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider"
                >
                  {hdr}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-sm text-zinc-500">
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-accent-indigo" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Fetching data...</span>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-sm text-zinc-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              items.map((item, index) => renderRow(item, index))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1 py-2">
          <div className="text-xs text-zinc-400">
            Showing page <span className="font-semibold text-zinc-200">{page}</span> of{' '}
            <span className="font-semibold text-zinc-200">{pages}</span> (Total{' '}
            <span className="font-semibold text-zinc-200">{totalCount}</span> entries)
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-800 text-zinc-400 bg-zinc-900/60 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition duration-150"
            >
              Previous
            </button>
            
            {/* Simple numeric list */}
            {Array.from({ length: Math.min(5, pages) }).map((_, idx) => {
              // Sliding window page list around current page
              let pageNum = idx + 1;
              if (page > 3 && pages > 5) {
                pageNum = page - 3 + idx;
                if (pageNum + (4 - idx) > pages) {
                  pageNum = pages - 4 + idx;
                }
              }
              return (
                <button
                  key={idx}
                  onClick={() => onPageChange(pageNum)}
                  className={`inline-flex items-center justify-center w-8 h-8 text-xs font-semibold rounded-md border transition duration-150 ${
                    page === pageNum
                      ? 'bg-accent-indigo/10 border-accent-indigo text-accent-indigo shadow-md shadow-accent-indigo/10'
                      : 'border-zinc-800 text-zinc-400 bg-zinc-900/40 hover:bg-zinc-800'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === pages}
              className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-800 text-zinc-400 bg-zinc-900/60 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition duration-150"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
