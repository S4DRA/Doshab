export default function DashboardLoading() {
  return (
    <main className="flex h-[100dvh] w-full overflow-hidden bg-[#050705] text-white">
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="h-12 border-b border-white/40 bg-[#050505]" />
        <div className="grid flex-1 place-items-center p-4">
          <section
            aria-label="Loading"
            className="doshab-loader px-8 py-7 text-center"
          >
            <svg
              aria-hidden="true"
              className="doshab-loader-vector mx-auto"
              viewBox="0 0 220 220"
            >
              <g className="doshab-vector-rays" stroke="currentColor" strokeLinecap="round">
                {Array.from({ length: 18 }).map((_, index) => (
                  <line
                    key={index}
                    x1="110"
                    x2="110"
                    y1="28"
                    y2="86"
                    transform={`rotate(${index * 20} 110 110)`}
                  />
                ))}
              </g>
              <path
                className="doshab-vector-vine"
                d="M123 43c49 11 70 64 39 106-10 14-24 23-40 27"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="8"
              />
              <path
                className="doshab-vector-curl"
                d="M114 44c11-18 36-15 38 4 2 17-22 20-24 7 10 5 17-3 11-10-6-8-19-4-25 8"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="5"
              />
              <g className="doshab-vector-leaves">
                <path d="M72 72 43 95l43 8 18-29z" />
                <path d="M105 72 83 105l44-4 18-29z" />
                <path d="M88 68 100 35l18 34-15 28z" />
              </g>
              <path
                className="doshab-vector-stem"
                d="M111 83 103 116"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="7"
              />
              <g className="doshab-vector-grapes">
                {[
                  [109, 118, 18],
                  [86, 137, 16],
                  [132, 137, 16],
                  [98, 158, 15],
                  [121, 158, 15],
                  [110, 179, 14],
                  [83, 165, 12],
                  [136, 165, 12],
                ].map(([cx, cy, r], index) => (
                  <path
                    d={`M${cx} ${cy - r} ${cx + r} ${cy} ${cx} ${cy + r} ${cx - r} ${cy}Z`}
                    key={`${cx}-${cy}`}
                    style={{ animationDelay: `${index * 70}ms` }}
                  />
                ))}
              </g>
              <g className="doshab-vector-shards">
                <path d="M37 55 49 67 37 79 25 67Z" />
                <path d="M178 62 190 74 178 86 166 74Z" />
                <path d="M44 160 56 172 44 184 32 172Z" />
                <path d="M177 165 189 177 177 189 165 177Z" />
              </g>
            </svg>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-white">
              Loading
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
