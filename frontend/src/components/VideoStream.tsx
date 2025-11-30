'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VideoStreamProps {
  defaultUrl?: string;
}

// For client-side fetching, we need the browser-accessible URL (localhost:8000)
// not the Docker internal URL (backend:8000)
const getDefaultStreamUrl = () => {
  return 'http://192.168.128.10:8080';
};

export default function VideoStream({ defaultUrl }: VideoStreamProps) {
  const [streamUrl, setStreamUrl] = useState(defaultUrl || getDefaultStreamUrl());
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'default' | 'connected' | 'error' }>({
    message: 'Click Connect to start',
    type: 'default',
  });
  const [stats, setStats] = useState<{ frames: number; fps: string } | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const streamingRef = useRef(false);
  const frameCountRef = useRef(0);
  const startTimeRef = useRef(0);

  const refreshFrame = useCallback((baseUrl: string) => {
    if (!streamingRef.current) return;

    // Proxy external URLs through backend to bypass CORS
    const proxyUrl = `http://localhost:8000/api/stream-proxy?url=${encodeURIComponent(baseUrl)}&t=${Date.now()}`;

    const newImg = new Image();
    newImg.onload = () => {
      if (imgRef.current) {
        imgRef.current.src = newImg.src;
      }
      frameCountRef.current++;

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const fps = (frameCountRef.current / elapsed).toFixed(1);
      setStats({ frames: frameCountRef.current, fps });
      setStatus({ message: 'Connected', type: 'connected' });

      if (streamingRef.current) {
        requestAnimationFrame(() => refreshFrame(baseUrl));
      }
    };
    newImg.onerror = () => {
      if (streamingRef.current) {
        setStatus({ message: 'Connection error - retrying...', type: 'error' });
        setTimeout(() => refreshFrame(baseUrl), 1000);
      }
    };
    newImg.src = proxyUrl;
  }, []);

  const startStream = useCallback(() => {
    const url = streamUrl.trim();
    if (!url) {
      setStatus({ message: 'Enter a URL', type: 'error' });
      return;
    }

    streamingRef.current = true;
    setStreaming(true);
    frameCountRef.current = 0;
    startTimeRef.current = Date.now();
    setStatus({ message: 'Connecting...', type: 'default' });

    refreshFrame(url);
  }, [streamUrl, refreshFrame]);

  const stopStream = useCallback(() => {
    streamingRef.current = false;
    setStreaming(false);
    setStatus({ message: 'Disconnected', type: 'default' });
    setStats(null);
  }, []);

  const toggleStream = useCallback(() => {
    if (streaming) {
      stopStream();
    } else {
      startStream();
    }
  }, [streaming, startStream, stopStream]);

  useEffect(() => {
    return () => {
      streamingRef.current = false;
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      toggleStream();
    }
  };

  const captureAndOCR = useCallback(async () => {
    if (!imgRef.current || !imgRef.current.src) {
      setStatus({ message: 'No frame to capture', type: 'error' });
      return;
    }

    setOcrLoading(true);
    setOcrResult(null);

    try {
      // Create canvas and draw current frame
      const canvas = document.createElement('canvas');
      const img = imgRef.current;
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      ctx.drawImage(img, 0, 0);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', 0.9);
      });

      // Upload to backend
      const formData = new FormData();
      formData.append('file', blob, 'screenshot.jpg');

      const uploadRes = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed: ${uploadRes.status}`);
      }

      // Trigger OCR
      const ocrRes = await fetch('http://localhost:8000/api/recognize', {
        method: 'POST',
      });

      if (!ocrRes.ok) {
        throw new Error(`OCR failed: ${ocrRes.status}`);
      }

      const ocrData = await ocrRes.json();
      if (ocrData.error) {
        setOcrResult(`Error: ${ocrData.error}`);
      } else {
        setOcrResult(ocrData.raw_text || 'No text detected');
      }
    } catch (err) {
      setOcrResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setOcrLoading(false);
    }
  }, []);

  const statusColors = {
    default: 'text-muted-foreground',
    connected: 'text-green-500',
    error: 'text-red-500',
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Video Stream</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Input
            type="text"
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="http://IP:PORT"
            className="flex-1 min-w-[200px]"
          />
          <Button onClick={toggleStream} variant={streaming ? 'destructive' : 'default'}>
            {streaming ? 'Disconnect' : 'Connect'}
          </Button>
          <Button onClick={captureAndOCR} variant="secondary" disabled={ocrLoading}>
            {ocrLoading ? 'Processing...' : 'Capture & OCR'}
          </Button>
        </div>

        <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center min-h-[300px]">
          <img
            ref={imgRef}
            alt="Video Stream"
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>

        <div className="flex justify-between items-center text-sm">
          <p className={statusColors[status.type]}>{status.message}</p>
          {stats && (
            <p className="text-muted-foreground font-mono">
              Frames: {stats.frames} | FPS: {stats.fps}
            </p>
          )}
        </div>

        {ocrResult && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">OCR Result:</h3>
            <pre className="whitespace-pre-wrap text-sm">{ocrResult}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
