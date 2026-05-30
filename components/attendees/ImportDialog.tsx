"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, FileUp, RotateCcw, Upload, X } from "lucide-react";
import { bulkAddAttendees } from "@/lib/db";
import { parseLumaCsv, type LumaCsvParseResult } from "@/lib/lumaCsv";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PREVIEW_LIMIT = 6;

interface ImportDialogProps {
  eventId: string;
  onImported: () => void | Promise<void>;
}

export function ImportDialog({ eventId, onImported }: ImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parseResult, setParseResult] = useState<LumaCsvParseResult | null>(null);
  const [parseError, setParseError] = useState("");
  const [importing, setImporting] = useState(false);

  function reset() {
    setFileName("");
    setParseResult(null);
    setParseError("");
    setDragOver(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setParseError("Please upload a .csv file.");
        setParseResult(null);
        setFileName("");
        return;
      }
      try {
        const text = await file.text();
        const result = parseLumaCsv(text, eventId);
        setFileName(file.name);
        setParseResult(result);
        setParseError("");
      } catch (err) {
        setParseResult(null);
        setFileName(file.name);
        setParseError(err instanceof Error ? err.message : "Failed to parse CSV");
      }
    },
    [eventId]
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void processFile(file);
  }

  async function handleImport() {
    if (!parseResult || parseResult.rows.length === 0) return;
    setImporting(true);
    try {
      const count = await bulkAddAttendees(parseResult.rows);
      await onImported();
      toast.success(`Imported ${count} attendee${count !== 1 ? "s" : ""}`);
      handleOpenChange(false);
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  }

  const previewRows = parseResult?.rows.slice(0, PREVIEW_LIMIT) ?? [];
  const importCount = parseResult?.rows.length ?? 0;
  const hasFile = !!fileName;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-9 gap-2">
          <Upload className="size-4" aria-hidden />
          Import CSV
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[94dvh] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border px-4 py-4 sm:px-6">
          <DialogTitle>Import Luma CSV</DialogTitle>
          <DialogDescription className="text-xs">
            Ticket IDs are derived from the QR check-in URL so scans match imported attendees.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="space-y-4">
            {/* Drop zone — compact when file is already loaded */}
            {!hasFile ? (
              <div
                role="button"
                tabIndex={0}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/20 hover:bg-muted/40"
                )}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); }
                }}
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <FileUp className="size-5 text-muted-foreground" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium">Drop a CSV or click to browse</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Luma: Guests → approved → Download CSV
                  </p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  aria-label="Choose CSV file"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <FileUp className="size-4 text-muted-foreground" aria-hidden />
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{fileName}</p>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Choose a different file"
                  onClick={reset}
                >
                  <X className="size-4" />
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  aria-label="Choose CSV file"
                  onChange={handleFileChange}
                />
              </div>
            )}

            {parseError && (
              <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {parseError}
              </p>
            )}

            {parseResult && (
              <div className="space-y-3">
                {/* Summary stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Rows in file</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums">{parseResult.totalRows}</p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-800 dark:bg-emerald-950/40">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Will import</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">{importCount}</p>
                  </div>
                  {parseResult.skipped.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950/40">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">Skipped</p>
                      <p className="mt-0.5 text-lg font-semibold tabular-nums text-amber-700 dark:text-amber-400">{parseResult.skipped.length}</p>
                    </div>
                  )}
                  {parseResult.duplicateTicketIds.length > 0 && (
                    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Duplicates</p>
                      <p className="mt-0.5 text-lg font-semibold tabular-nums">{parseResult.duplicateTicketIds.length}</p>
                    </div>
                  )}
                </div>

                {/* Row preview */}
                {previewRows.length > 0 && (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Preview</p>
                      {parseResult.rows.length > 0 && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="size-3 text-emerald-500" aria-hidden />
                          <span className="text-[11px] text-muted-foreground">Ticket IDs matched</span>
                        </div>
                      )}
                    </div>
                    <div className="max-h-44 overflow-y-auto">
                      {previewRows.map((row) => (
                        <div
                          key={row.ticketId}
                          className="grid grid-cols-[1fr_auto] gap-2 border-b border-border px-3 py-2 last:border-b-0"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{row.name}</p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {row.email}{row.ticketType ? ` · ${row.ticketType}` : ""}
                            </p>
                          </div>
                          <p className="shrink-0 self-center font-mono text-[11px] text-muted-foreground">
                            {row.ticketId.slice(0, 10)}…
                          </p>
                        </div>
                      ))}
                    </div>
                    {importCount > PREVIEW_LIMIT && (
                      <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                        +{importCount - PREVIEW_LIMIT} more rows
                      </p>
                    )}
                  </div>
                )}

                {importCount === 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950/40">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      No importable rows found. Check that the file has a <code className="font-mono">qr_code_url</code> column.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 shrink-0 flex-row justify-between gap-2 border-t border-border px-4 py-3 sm:px-6">
          {hasFile && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={reset}>
              <RotateCcw className="size-3.5" aria-hidden />
              Reset
            </Button>
          )}
          <div className={cn("flex gap-2", !hasFile && "ml-auto")}>
            <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleImport}
              disabled={!parseResult || importCount === 0 || importing}
            >
              {importing
                ? "Importing…"
                : importCount > 0
                  ? `Import ${importCount} attendee${importCount !== 1 ? "s" : ""}`
                  : "Import attendees"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
