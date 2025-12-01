import { useState, useCallback } from 'react';

export interface UploadProgress {
  fileName: string;
  uploadedChunks: number;
  totalChunks: number;
  percentComplete: number;
  status: 'idle' | 'uploading' | 'completing' | 'completed' | 'error';
  error?: string;
  fileUrl?: string;
}

interface UseChunkedUploadOptions {
  onProgress?: (progress: UploadProgress) => void;
}

export function useChunkedUpload(options?: UseChunkedUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, UploadProgress>>({});

  const updateProgress = useCallback(
    (fileName: string, updates: Partial<UploadProgress>) => {
      setProgress((prev) => {
        const current = prev[fileName] || {
          fileName,
          uploadedChunks: 0,
          totalChunks: 0,
          percentComplete: 0,
          status: 'idle' as const,
        };

        const updated = { ...current, ...updates };
        updated.percentComplete =
          updated.totalChunks > 0
            ? Math.round((updated.uploadedChunks / updated.totalChunks) * 100)
            : 0;

        options?.onProgress?.(updated);
        return { ...prev, [fileName]: updated };
      });
    },
    [options]
  );

  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      const fileName = file.name;

      try {
        updateProgress(fileName, { status: 'uploading', error: undefined });

        // 1. 初始化上傳 session
        const initResponse = await fetch('/api/upload/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName,
            totalSize: file.size,
          }),
        });

        if (!initResponse.ok) {
          throw new Error('上傳初始化失敗');
        }

        const { uploadId, chunkSize, totalChunks } =
          await initResponse.json();

        updateProgress(fileName, {
          totalChunks,
          uploadedChunks: 0,
        });

        // 2. 逐塊上傳
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          const start = chunkIndex * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const chunk = file.slice(start, end);

          const formData = new FormData();
          formData.append('uploadId', uploadId);
          formData.append('chunkIndex', chunkIndex.toString());
          formData.append('chunk', chunk);

          const chunkResponse = await fetch('/api/upload/chunk', {
            method: 'POST',
            body: formData,
          });

          if (!chunkResponse.ok) {
            throw new Error(`分塊 ${chunkIndex} 上傳失敗`);
          }

          updateProgress(fileName, {
            uploadedChunks: chunkIndex + 1,
          });
        }

        // 3. 完成上傳（合併分塊）
        updateProgress(fileName, { status: 'completing' });

        const completeResponse = await fetch('/api/upload/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uploadId,
            fileName,
          }),
        });

        if (!completeResponse.ok) {
          throw new Error('完成上傳失敗');
        }

        const { fileUrl } = await completeResponse.json();

        updateProgress(fileName, {
          status: 'completed',
          fileUrl,
        });

        return fileUrl;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '上傳失敗';
        updateProgress(fileName, {
          status: 'error',
          error: errorMessage,
        });
        return null;
      }
    },
    [updateProgress]
  );

  const uploadMultipleFiles = useCallback(
    async (files: File[]): Promise<(string | null)[]> => {
      setUploading(true);
      try {
        const results = await Promise.all(files.map((file) => uploadFile(file)));
        return results;
      } finally {
        setUploading(false);
      }
    },
    [uploadFile]
  );

  const clearProgress = useCallback((fileName?: string) => {
    if (fileName) {
      setProgress((prev) => {
        const next = { ...prev };
        delete next[fileName];
        return next;
      });
    } else {
      setProgress({});
    }
  }, []);

  return {
    uploading,
    progress,
    uploadFile,
    uploadMultipleFiles,
    clearProgress,
  };
}
