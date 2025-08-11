import { toast } from "sonner";

// Endpoint strategy: prefer same-origin proxy in prod; fallback to direct backend on proxy failure
const PRIMARY_API_URL =
  typeof window !== "undefined" && window.location.hostname.endsWith("trizenventures.com")
    ? "/api"
    : "http://localhost:5001/api";

const DIRECT_BACKEND_URL = "https://trizenlmsinstructorbackend.llp.trizenventures.com/api";

// Per-chunk timeouts. Final chunk includes merge + storage upload and can take longer
const CHUNK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const FINAL_CHUNK_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export interface UploadProgressCallback {
  (progress: number): void;
}

export type UploadedFileInfo = {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  baseURL?: string;
  videoUrl: string;
  message?: string;
};

export interface UploadCompleteCallback {
  (fileInfo: UploadedFileInfo, usingFallback?: boolean): void;
}

export interface UploadErrorCallback {
  (error: Error): void;
}

export const uploadVideo = async (
  file: File,
  onProgress: UploadProgressCallback,
  onComplete: UploadCompleteCallback,
  onError: UploadErrorCallback
) => {
  const chunkSize = 10 * 1024 * 1024; // 10MB chunks for better performance
  const chunks = Math.ceil(file.size / chunkSize);
  
  let baseUrl = PRIMARY_API_URL;
  let hasSwitchedToDirect = false;

  try {
    for (let start = 0; start < file.size; start += chunkSize) {
      const chunk = file.slice(start, start + chunkSize);
      const formData = new FormData();
      
      formData.append("video", chunk, file.name);
      formData.append("chunk", Math.floor(start / chunkSize).toString());
      formData.append("totalChunks", chunks.toString());
      formData.append("originalname", file.name);

      try {
        console.log(`Uploading chunk ${Math.floor(start / chunkSize) + 1}/${chunks}`);
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const isFinalChunk = Math.floor(start / chunkSize) === chunks - 1;
        const timeoutId = setTimeout(
          () => controller.abort(),
          isFinalChunk ? FINAL_CHUNK_TIMEOUT_MS : CHUNK_TIMEOUT_MS
        );

        const response = await fetch(`${baseUrl}/upload`, {
          method: "POST",
          body: formData,
          credentials: 'include',
          signal: controller.signal,
          cache: 'no-store'
        });

        // Clear the timeout
        clearTimeout(timeoutId);

        if (!response.ok) {
          // If proxy timed out or failed early and we haven't switched yet, try direct backend once
          if (!hasSwitchedToDirect && PRIMARY_API_URL === "/api" && (response.status === 504 || response.status === 502)) {
            console.warn(`Proxy returned ${response.status}. Switching to direct backend for uploads...`);
            baseUrl = DIRECT_BACKEND_URL;
            hasSwitchedToDirect = true;
            // Retry this chunk immediately against direct backend
            const retryResponse = await fetch(`${baseUrl}/upload`, {
              method: "POST",
              body: formData,
              credentials: 'include',
              signal: controller.signal,
              cache: 'no-store'
            });
            if (!retryResponse.ok) {
              const retryErr: { error?: string } = await retryResponse.json().catch(() => ({}));
              throw new Error(retryErr.error || `Chunk upload failed with status: ${retryResponse.status}`);
            }
            // Replace response with successful retry for downstream parsing
            // Note: for non-final chunks we don't need body; for final we parse below
            // Continue to progress update below
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Chunk upload failed with status: ${response.status}`);
          }
        }

        // Calculate accurate progress
        const currentProgress = ((start + chunk.size) / file.size) * 100;
        onProgress(Math.min(currentProgress, 100));
        
        // If this is the final chunk, get the complete file info
        if (isFinalChunk) {
          const responseData = await response.json();
          console.log("Final chunk response:", responseData);
          
          // Determine if we're using the fallback storage
          const usingFallback = responseData.message && (
            responseData.message.includes("local storage") || 
            responseData.message.includes("fallback") ||
            (responseData.file && responseData.file.videoUrl && (
              responseData.file.videoUrl.includes('localhost') || 
              responseData.file.videoUrl.includes('127.0.0.1')
            ))
          );
          
          if (responseData.file && responseData.file.videoUrl) {
            // Pass along the entire response data so we can detect if this was a fallback
            const fileInfo = {
              ...responseData.file,
              message: responseData.message
            };
            onComplete(fileInfo, usingFallback);
            onProgress(100); // Ensure we show 100% when complete
          } else {
            throw new Error("Invalid response from server for the final chunk");
          }
        }
      } catch (error) {
        console.error("Error uploading chunk:", error);
        onError(error instanceof Error ? error : new Error("Unknown error during upload"));
        return;
      }
    }
  } catch (error) {
    console.error("Error in upload process:", error);
    onError(error instanceof Error ? error : new Error("Unknown error during upload"));
  }
};

export const validateVideoFile = (file: File): string | null => {
  if (!file) {
    return "Please select a video file";
  }

  if (!file.type.startsWith("video/")) {
    return "Please select a valid video file";
  }

  // 5GB limit (5000MB)
  if (file.size > 5000 * 1024 * 1024) {
    return "The file size exceeds 5GB (5000MB). Please upload a smaller file.";
  }

  return null;
};
