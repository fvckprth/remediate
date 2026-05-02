export function Logo({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <img
      src="/logo.png"
      alt="Remediate"
      width={size}
      height={size}
      className={className}
    />
  );
}
