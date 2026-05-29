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
  const isRunningRef = useRef(false);
  const onScanRef = useRef(onScan);
  const pausedRef = useRef(paused);
  const invertTimerRef = useRef<number | null>(null);
  const [error, setError] = useState("");

  onScanRef.current = onScan;
  pausedRef.current = paused;

  useEffect(() => {
    let cancelled = false;

    const scanner = new Html5Qrcode(elementId, {
      verbose: false,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
    });
    scannerRef.current = scanner;

    const handleDecoded = (decoded: string) => onScanRef.current(decoded);

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 12, qrbox: { width: 260, height: 260 }, aspectRatio: 1 },
        handleDecoded,
        () => {},
      )
      .then(() => {
        if (cancelled) {
          scanner.stop().catch(() => {});
          return;
        }
        isRunningRef.current = true;

        // Apply any pause that was requested before start() resolved.
        if (pausedRef.current) scanner.pause(true);

        // Fallback for browsers without BarcodeDetector (iOS Safari, etc.):
        // periodically grab a frame, invert it, and try decoding via the
        // library's still-image API. Catches white-on-dark QR codes.
        const tryInverted = async () => {
          const video = document.querySelector(`#${elementId} video`) as HTMLVideoElement | null;
          if (!video || video.readyState < 2) return;
          const w = video.videoWidth;
          const h = video.videoHeight;
          if (!w || !h) return;
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
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
          await new Promise<void>((resolve) =>
            canvas.toBlob((blob) => {
              if (!blob) return resolve();
              const file = new File([blob], "frame.png", { type: "image/png" });
              const oneShot = new Html5Qrcode(oneshotId, {
                verbose: false,
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
              });
              oneShot
                .scanFile(file, false)
                .then((text) => handleDecoded(text))
                .catch(() => {})
                .finally(() => {
                  try {
                    oneShot.clear();
                  } catch {
                    /* ignore */
                  }
                  resolve();
                });
            }, "image/png"),
          );
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
      if (isRunningRef.current) {
        isRunningRef.current = false;
        Promise.resolve(scanner.stop())
          .then(() => Promise.resolve(scanner.clear()))
          .catch(() => {});
      } else {
        Promise.resolve(scanner.clear()).catch(() => {});
      }
    };
  }, [elementId, oneshotId]);

  useEffect(() => {
    const s = scannerRef.current;
    if (!s || !isRunningRef.current) return;
    if (paused) s.pause(true);
    else {
      try {
        s.resume();
      } catch {
        /* ignore */
      }
    }
  }, [paused]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full overflow-hidden rounded-2xl bg-black aspect-square sm:aspect-[4/3]">
        <div id={elementId} className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
        <div id={oneshotId} className="hidden" />

        {/* Corner brackets */}
        <div className="pointer-events-none absolute inset-0">
          <span className="absolute left-5 top-5 h-8 w-8 border-l-2 border-t-2 border-lime-400" />
          <span className="absolute right-5 top-5 h-8 w-8 border-r-2 border-t-2 border-lime-400" />
          <span className="absolute bottom-5 left-5 h-8 w-8 border-b-2 border-l-2 border-lime-400" />
          <span className="absolute bottom-5 right-5 h-8 w-8 border-b-2 border-r-2 border-lime-400" />
        </div>
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {error ? "Camera unavailable — use manual entry" : "Point camera at attendee QR"}
      </p>
    </div>
  );
}
