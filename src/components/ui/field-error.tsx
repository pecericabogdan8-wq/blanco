import { cn } from "@/lib/utils";

/** Jarvis-style inline field error: red text under the control. */
export function FieldError({
  message,
  className,
}: {
  message?: string | null;
  className?: string;
}) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className={cn("mt-1 text-[13px] leading-snug text-[#c41e3a]", className)}
    >
      {message}
    </p>
  );
}
