export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #1C1B1A 0%, #2C2C2A 50%, #26215C 100%)' }}
    >
      {/* Glow orbs — scaled down on small screens */}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 sm:-top-24 sm:-right-24 sm:w-72 sm:h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(127,119,221,0.15) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-48 h-48 sm:-bottom-24 sm:-left-24 sm:w-72 sm:h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(29,158,117,0.10) 0%, transparent 70%)' }}
      />

      {/* Wordmark */}
      <div className="mb-6 sm:mb-8 relative">
        <span className="text-[26px] sm:text-[28px] font-medium tracking-[-0.03em]" style={{ color: '#7F77DD' }}>
          volta
        </span>
      </div>

      {/* Card — tighter padding on small screens */}
      <div
        className="w-full max-w-sm relative rounded-2xl p-6 sm:p-8"
        style={{
          background: '#fff',
          boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.2)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
