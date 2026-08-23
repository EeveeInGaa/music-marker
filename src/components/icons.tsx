interface IconProps {
  className?: string;
}

export function FolderIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} focusable="false" viewBox="0 0 20 20">
      <path d="M2.75 5.25A1.75 1.75 0 0 1 4.5 3.5h3.08c.46 0 .9.18 1.23.51l1.02 1.02c.14.14.33.22.53.22h5.14A1.75 1.75 0 0 1 17.25 7v7.25A1.75 1.75 0 0 1 15.5 16H4.5a1.75 1.75 0 0 1-1.75-1.75v-9Z" />
    </svg>
  );
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} focusable="false" viewBox="0 0 20 20">
      <path d="M5.75 4.25h2.5v11.5h-2.5zM11.75 4.25h2.5v11.5h-2.5z" />
    </svg>
  );
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} focusable="false" viewBox="0 0 20 20">
      <path d="M6.25 4.4v11.2L15.1 10 6.25 4.4Z" />
    </svg>
  );
}

export function TruncatedLinesIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} focusable="false" viewBox="0 0 20 20">
      <path d="M3.5 4.75h13v1.5h-13zM3.5 8.75h8v1.5h-8zM13 8.75h1.5v1.5H13zM16 8.75h1.5v1.5H16zM3.5 12.75h5v1.5h-5z" />
    </svg>
  );
}

export function WrappedLinesIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} focusable="false" viewBox="0 0 20 20">
      <path d="M3.5 4.75h13v1.5h-13zM3.5 8.75h10v1.5h-10zM3.5 12.75h7v1.5h-7z" />
    </svg>
  );
}
