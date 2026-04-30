export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #1C1B1A 0%, #2C2C2A 50%, #26215C 100%)' }}
    >
      {/* Glow orbs */}
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(127,119,221,0.15) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(29,158,117,0.10) 0%, transparent 70%)' }}
      />

      {/* Wordmark */}
      <div className="mb-8 relative">
        <span className="text-[28px] font-medium tracking-[-0.03em]" style={{ color: '#7F77DD' }}>
          rally
        </span>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm relative rounded-2xl p-8"
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
