import { LoaderCircle, Zap } from "lucide-react";

export function PageLoader({
  message = "Loading page...",
}: {
  message?: string;
}) {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-background px-4 text-foreground"
      role="status"
      aria-live="polite"
    >
      <div className="card-surface flex w-full max-w-xs flex-col items-center gap-4 px-6 py-7 text-center">
        <span className="relative flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Zap className="size-6" aria-hidden />
          <LoaderCircle
            className="absolute -right-1 -top-1 size-5 animate-spin text-primary"
            aria-hidden
          />
        </span>
        <div>
          <p className="text-sm font-semibold tracking-tight">{message}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Preparing your ClaimFlow workspace
          </p>
        </div>
      </div>
    </div>
  );
}
