/** Shared admin icons — ported 1:1 from the Moniva Admin design mockup. */
type IconProps = { size?: number };

export const Icons = {
  dash: ({ size = 18 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="6" height="8" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="2" width="6" height="5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="12" width="6" height="4" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="9" width="6" height="7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  prod: ({ size = 18 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M9 2L15.5 5.5V12.5L9 16L2.5 12.5V5.5L9 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M2.5 5.5L9 9L15.5 5.5M9 9V16" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  cat: ({ size = 18 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="6" height="6" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="2" width="6" height="6" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="10" width="6" height="6" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="10" width="6" height="6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  brand: ({ size = 18 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M2 4L9 1.5L16 4V9C16 13 12.5 15.5 9 16.5C5.5 15.5 2 13 2 9V4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  order: ({ size = 18 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <rect x="3" y="3" width="12" height="13" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 7H12M6 10H12M6 13H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  quoteNew: ({ size = 18 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M4 2H10L14 6V16H4V2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M10 2V6H14" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 9V13M7 11H11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  page: ({ size = 18 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M4 2H11L14 5V16H4V2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M11 2V5H14" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  news: ({ size = 18 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <rect x="2" y="3" width="14" height="12" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 6H10M5 9H13M5 12H11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  cata: ({ size = 18 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M9 4C9 4 7 2.5 4 2.5C2.8 2.5 2 3 2 3V14C2 14 2.8 13.5 4 13.5C7 13.5 9 15 9 15M9 4C9 4 11 2.5 14 2.5C15.2 2.5 16 3 16 3V14C16 14 15.2 13.5 14 13.5C11 13.5 9 15 9 15M9 4V15" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  user: ({ size = 18 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 16C3 12.5 5.5 10.5 9 10.5C12.5 10.5 15 12.5 15 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  msg: ({ size = 18 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M2 4H16V13H10L7 16V13H2V4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  set: ({ size = 18 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 1.5V4M9 14V16.5M16.5 9H14M4 9H1.5M14.3 3.7L12.5 5.5M5.5 12.5L3.7 14.3M14.3 14.3L12.5 12.5M5.5 5.5L3.7 3.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  search: ({ size = 15 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 12L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  bell: ({ size = 16 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M4 13V8C4 5.2 6.2 3 9 3C11.8 3 14 5.2 14 8V13L15.5 14.5H2.5L4 13Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M7.5 14.5C7.5 15.3 8.2 16 9 16C9.8 16 10.5 15.3 10.5 14.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  plus: ({ size = 14 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  more: ({ size = 14 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="3" cy="7" r="1.2" fill="currentColor" />
      <circle cx="7" cy="7" r="1.2" fill="currentColor" />
      <circle cx="11" cy="7" r="1.2" fill="currentColor" />
    </svg>
  ),
  arrowUp: ({ size = 10 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none">
      <path d="M5 8V2M2 5L5 2L8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  arrowDn: ({ size = 10 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none">
      <path d="M5 2V8M2 5L5 8L8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  exp: ({ size = 12 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M3 9L9 3M9 3H4M9 3V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  report: ({ size = 18 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M3 15V8M7 15V4M11 15V10M15 15V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M2 16.2H16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
};
