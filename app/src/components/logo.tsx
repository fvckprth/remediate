import Image from "next/image";

export function Logo({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="Remediate"
      width={size}
      height={size}
      priority
      className={className}
    />
  );
}
