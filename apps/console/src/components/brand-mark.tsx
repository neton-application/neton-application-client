import Image from "next/image";
import { cn } from "@neton/application-client-kit";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#101828] shadow-[0_8px_24px_rgba(37,99,235,0.2)]",
        className,
      )}
      aria-hidden="true"
    >
      <Image src="/neton-icon.png" alt="" fill sizes="36px" className="object-cover" priority />
    </span>
  );
}
