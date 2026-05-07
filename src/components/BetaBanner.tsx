'use client';

export function BetaBanner() {
  if (process.env.NEXT_PUBLIC_BETA_MODE !== 'true') return null;
  return (
    <div className="bg-amber-400 text-amber-950 text-center text-xs font-semibold py-1.5 px-4">
      ⚠️ BETA — Not for production use. Data may be reset without notice.
    </div>
  );
}
