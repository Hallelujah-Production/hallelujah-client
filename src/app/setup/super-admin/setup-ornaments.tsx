export function OliveCorner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 220" className={className} fill="none" aria-hidden="true">
      <path
        d="M18 196c46-10 72-46 70-86 38 16 64-8 60-42 28 12 46-10 42-34"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M88 118c-18-4-16 22-2 26M132 78c-16 2-14 20-1 22M48 168c-14 4-12 18 1 20"
        stroke="hsl(38 55% 46% / 0.7)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <ellipse cx="82" cy="108" rx="11" ry="5" fill="currentColor" opacity="0.45" />
      <ellipse cx="128" cy="70" rx="10" ry="4.5" fill="currentColor" opacity="0.38" />
      <ellipse cx="44" cy="176" rx="10" ry="4.5" fill="currentColor" opacity="0.34" />
      <ellipse cx="156" cy="48" rx="8" ry="3.5" fill="hsl(38 55% 46% / 0.45)" />
    </svg>
  );
}

export function GoldCross({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden="true">
      <path d="M8 1.5v13M2.4 6.2h11.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function GoldCrown({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <path
        d="M3 14.5h14l-1.2-7.2-3.4 3.1L10 5.2 7.6 10.4 4.2 7.3 3 14.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M4 16.2h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
