"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

export function QRScanner({
  paused,
  onScan,
}: {
  paused: boolean;
  onScan: (payload: string) => void;
}) {
  const elementId = useId().replaceAll(":", "");
  const oneshotId = `${elementId}-oneshot`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const oneshotRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const onScanRef = useRef(onScan);
  const pausedRef = useRef(paused);
  const invertTimerRef = useRef<number | null>(null);
  const invertBusyRef = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    onScanRef.current = onScan;
    pausedRef.current = paused;
  }, [onScan, paused]);

  useEffect(() => {
    let cancelled = false;

    const scanner = new Html5Qrcode(elementId, {
      verbose: false,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
    });
    scannerRef.current = scanner;

    // Drop decodes once we're torn down or the result overlay has paused us,
    // so a late callback never updates an unmounted/paused tree.
    const handleDecoded = (decoded: string) => {
      if (cancelled || pausedRef.current) return;
      onScanRef.current(decoded);
    };

    // Native BarcodeDetector (Chrome/Android, newer Safari) handles the live
    // stream including inverted codes, so the costly per-frame fallback is
    // only needed where it's missing (older iOS Safari, etc.).
    const hasBarcodeDetector =
      typeof window !== "undefined" && "BarcodeDetector" in window;

    // Responsive scan box: a fixed 260px box can exceed the video on small
    // viewports and make start() reject. Derive it from the viewfinder.
    const qrbox = (viewfinderWidth: number, viewfinderHeight: number) => {
      const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.8);
      const size = Math.max(160, Math.min(edge, 320));
      return { width: size, height: size };
    };

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 12, qrbox, aspectRatio: 1 },
        handleDecoded,
        () => {},
      )
      .then(() => {
        if (cancelled) {
          scanner.stop().catch(() => {});
          return;
        }
        isRunningRef.current = true;

        // Honor pause intent requested before start() resolved.
        if (pausedRef.current) {
          try {
            scanner.pause(true);
          } catch {
            /* ignore */
          }
        }

        if (hasBarcodeDetector) return;

        // Fallback for browsers without BarcodeDetector (iOS Safari, etc.):
        // periodically grab a frame, invert it, and try decoding via the
        // library's still-image API. Catches white-on-dark QR codes.
        const oneShot = new Html5Qrcode(oneshotId, {
          verbose: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        });
        oneshotRef.current = oneShot;

        const tryInverted = async () => {
          // Skip while paused, torn down, or a previous tick is still running.
          if (cancelled || pausedRef.current || invertBusyRef.current) return;
          const video = document.querySelector(`#${elementId} video`) as HTMLVideoElement | null;
          if (!video || video.readyState < 2) return;
          const w = video.videoWidth;
          const h = video.videoHeight;
          if (!w || !h) return;

          invertBusyRef.current = true;
          try {
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) return;
            ctx.drawImage(video, 0, 0, w, h);
            const img = ctx.getImageData(0, 0, w, h);
            const d = img.data;
            for (let i = 0; i < d.length; i += 4) {
              d[i] = 255 - d[i];
              d[i + 1] = 255 - d[i + 1];
              d[i + 2] = 255 - d[i + 2];
            }
            ctx.putImageData(img, 0, 0);
            const blob = await new Promise<Blob | null>((resolve) =>
              canvas.toBlob((b) => resolve(b), "image/png"),
            );
            if (!blob || cancelled || pausedRef.current) return;
            const file = new File([blob], "frame.png", { type: "image/png" });
            try {
              const text = await oneShot.scanFile(file, false);
              handleDecoded(text);
            } catch {
              /* no QR found in this frame */
            }
          } finally {
            invertBusyRef.current = false;
          }
        };
        invertTimerRef.current = window.setInterval(tryInverted, 600);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Camera access is unavailable. Use manual entry below.");
        }
      });

    return () => {
      cancelled = true;
      if (invertTimerRef.current) {
        clearInterval(invertTimerRef.current);
        invertTimerRef.current = null;
      }

      const oneShot = oneshotRef.current;
      oneshotRef.current = null;
      if (oneShot) {
        try {
          oneShot.clear();
        } catch {
          /* ignore */
        }
      }

      if (isRunningRef.current) {
        isRunningRef.current = false;
        Promise.resolve(scanner.stop())
          .then(() => Promise.resolve(scanner.clear()))
          .catch(() => {});
      } else {
        Promise.resolve(scanner.clear()).catch(() => {});
      }
      scannerRef.current = null;
    };
  }, [elementId, oneshotId]);

  useEffect(() => {
    const s = scannerRef.current;
    // If the scanner isn't running yet, the start() success path reads
    // pausedRef and reconciles, so dropping here is safe (intent isn't lost).
    if (!s || !isRunningRef.current) return;
    try {
      if (paused) s.pause(true);
      else s.resume();
    } catch {
      /* ignore: scanner may be mid-transition */
    }
  }, [paused]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full overflow-hidden rounded-lg bg-zinc-950 aspect-square sm:aspect-[4/3]">
        <div id={elementId} className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
        <div id={oneshotId} className="hidden" />

        {/* Viewfinder corner brackets */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <span className="absolute left-6 top-6 h-7 w-7 border-l-2 border-t-2 border-primary" />
          <span className="absolute right-6 top-6 h-7 w-7 border-r-2 border-t-2 border-primary" />
          <span className="absolute bottom-6 left-6 h-7 w-7 border-b-2 border-l-2 border-primary" />
          <span className="absolute bottom-6 right-6 h-7 w-7 border-b-2 border-r-2 border-primary" />
        </div>
      </div>

      <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
        {error ? "Camera unavailable — use manual entry" : "Point camera at attendee QR"}
      </p>
    </div>
  );
}
