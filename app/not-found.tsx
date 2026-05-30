import Link from "next/link";
import { ArrowLeft, FileQuestion, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Zap className="size-6" aria-hidden />
          </span>
          <div className="flex size-16 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30">
            <FileQuestion className="size-8 text-muted-foreground" aria-hidden />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              404
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This link may be broken, or the event may no longer be public. Check the
              URL or return to ClaimFlow.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden />
              Go to home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
