"use client";

import type { ClaimType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ClaimResult } from "@/components/scanner/ClaimResult";
import { ManualEntry } from "@/components/scanner/ManualEntry";
import { QRScanner } from "@/components/scanner/QRScanner";
import { ScannerErrorBoundary } from "@/components/scanner/ScannerErrorBoundary";
import { useClaimScanner } from "@/hooks/useClaimScanner";

interface ScannerPanelProps {
  eventId: string;
  scannedBy: string;
  claimTypes: ClaimType[];
  emptyMessage?: string;
}

export function ScannerPanel({
  eventId,
  scannedBy,
  claimTypes,
  emptyMessage = "No claim types configured. Go to Setup to add some.",
}: ScannerPanelProps) {
  const {
    claimType,
    setClaimType,
    result,
    setResult,
    enabledClaimTypes,
    handleScan,
  } = useClaimScanner({ eventId, scannedBy, claimTypes });

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4">
      {enabledClaimTypes.length > 0 ? (
        <div role="group" aria-label="Claim type" className="flex flex-wrap gap-2">
          {enabledClaimTypes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setClaimType(item.id)}
              aria-pressed={claimType === item.id}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                claimType === item.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-background text-foreground hover:bg-muted"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      )}

      <ScannerErrorBoundary>
        <div className="relative">
          <QRScanner paused={Boolean(result) || !claimType} onScan={handleScan} />
          {result && (
            <ClaimResult result={result} onReset={() => setResult(null)} />
          )}
        </div>
      </ScannerErrorBoundary>

      <ManualEntry onSubmit={handleScan} />
    </div>
  );
}
