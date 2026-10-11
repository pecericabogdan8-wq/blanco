import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  markClassName?: string;
  invert?: boolean;
  withWordmark?: boolean;
};

/** Mark + «Blanco» на одній оптичній осі. */
export function BlancoLogo({
  className,
  markClassName,
  invert,
  withWordmark = false,
}: Props) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 sm:gap-2.5", className)}
      aria-label="Blanco"
    >
      <Image
        src={invert ? "/brand/logo-white.png?v=6" : "/brand/logo.png?v=6"}
        alt=""
        width={83}
        height={86}
        priority
        unoptimized
        className={cn(
          "block shrink-0 object-contain",
          markClassName ?? "size-7 sm:size-8"
        )}
      />
      {withWordmark && (
        <span
          className={cn(
            // Great_Vibes script: високий B-штрих тягне box вгору — трохи опускаємо
            "font-script block max-[340px]:hidden translate-y-[0.16em] text-[1.55rem] leading-none sm:text-[2.05rem]",
            invert ? "text-white" : "text-foreground"
          )}
        >
          Blanco
        </span>
      )}
    </span>
  );
}
