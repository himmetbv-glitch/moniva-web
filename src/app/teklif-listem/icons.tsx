/* Quote System ikonları — mockup'taki SVG path'lerinden birebir. */

type P = { className?: string };

const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const CartIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...p}>
    <path {...stroke} d="M3 3h2l3 12h10l3-8H6" />
    <circle cx="9" cy="20" r="1.5" fill="currentColor" />
    <circle cx="18" cy="20" r="1.5" fill="currentColor" />
  </svg>
);

export const ShieldIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...p}>
    <path {...stroke} d="M12 2 L4 6 V12 C4 17 8 21 12 22 C16 21 20 17 20 12 V6 Z" />
  </svg>
);

export const ClockIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...p}>
    <circle {...stroke} cx="12" cy="12" r="10" />
    <path {...stroke} d="M12 6 V12 L16 14" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...p}>
    <path {...stroke} d="M3 12 L8 17 L21 4" />
  </svg>
);

export const TrashIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...p}>
    <path
      {...stroke}
      d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
    />
  </svg>
);

export const SendIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...p}>
    <path {...stroke} d="M22 2 L11 13 M22 2 L15 22 L11 13 L2 9 Z" />
  </svg>
);

export const InfoIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...p}>
    <circle {...stroke} cx="12" cy="12" r="10" />
    <path {...stroke} d="M12 8 V12 M12 16 H12.01" />
  </svg>
);

export const BoxIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...p}>
    <path
      {...stroke}
      d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
    />
  </svg>
);

export const ArrowIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...p}>
    <path {...stroke} d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export const GearIllust = (p: P) => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5} {...p}>
    <circle cx="50" cy="50" r="34" />
    <circle cx="50" cy="50" r="22" />
    <circle cx="50" cy="50" r="10" fill="currentColor" opacity={0.3} />
  </svg>
);

export const CheckCircleIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...p}>
    <circle {...stroke} cx="12" cy="12" r="10" />
    <path {...stroke} d="M8 12 l3 3 l5 -6" />
  </svg>
);
