/**
 * API client for Video Subtitles Backend.
 *
 * Provides convenience functions to call backend endpoints and helpers to construct
 * stream and subtitle file URLs. All URLs are built using BACKEND_URL from config.
 */

import { BACKEND_URL } from '../config';

// Helper to handle JSON responses and errors
async function handleJsonResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  let body;
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }
  if (!res.ok) {
    const detail = typeof body === 'object' && body && body.detail ? body.detail : body;
    const err = new Error(`Request failed (${res.status}): ${detail}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

// PUBLIC_INTERFACE
export function streamUrl(videoId) {
  /** Return full URL for streaming a video by ID. */
  return `${BACKEND_URL}/videos/${encodeURIComponent(videoId)}/stream`;
}

// PUBLIC_INTERFACE
export function subtitleFileUrl(subtitleId) {
  /** Return full URL for fetching raw subtitle file by ID. */
  return `${BACKEND_URL}/subtitles/${encodeURIComponent(subtitleId)}/file`;
}

// PUBLIC_INTERFACE
export async function health() {
  /** Fetch backend health status. */
  const res = await fetch(`${BACKEND_URL}/`, { method: 'GET' });
  return handleJsonResponse(res);
}

// PUBLIC_INTERFACE
export async function fetchVideos({ q } = {}) {
  /**
   * Fetch list of videos. Optional search query "q".
   * Returns: Array<VideoListItem>
   */
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  const res = await fetch(`${BACKEND_URL}/videos${qs}`, { method: 'GET' });
  return handleJsonResponse(res);
}

// PUBLIC_INTERFACE
export async function fetchVideo(videoId) {
  /**
   * Fetch a single video's details by ID.
   * Returns: VideoOut
   */
  const res = await fetch(`${BACKEND_URL}/videos/${encodeURIComponent(videoId)}`, { method: 'GET' });
  return handleJsonResponse(res);
}

// PUBLIC_INTERFACE
export async function fetchSubtitles(videoId) {
  /**
   * List subtitles for a given video.
   * Returns: Array<SubtitleOut>
   */
  const res = await fetch(`${BACKEND_URL}/videos/${encodeURIComponent(videoId)}/subtitles`, { method: 'GET' });
  return handleJsonResponse(res);
}

// PUBLIC_INTERFACE
export async function uploadVideo({ file, title, description }) {
  /**
   * Upload a new video file.
   * Params:
   *  - file: File | Blob (required)
   *  - title: string (required)
   *  - description: string | undefined
   * Returns: VideoOut
   */
  if (!file) throw new Error('uploadVideo: "file" is required');
  if (!title) throw new Error('uploadVideo: "title" is required');

  const form = new FormData();
  form.append('file', file);

  const searchParams = new URLSearchParams();
  searchParams.set('title', title);
  if (description != null && description !== '') {
    searchParams.set('description', description);
  }

  const res = await fetch(`${BACKEND_URL}/videos/upload?${searchParams.toString()}`, {
    method: 'POST',
    body: form,
  });
  return handleJsonResponse(res);
}

// PUBLIC_INTERFACE
export async function uploadSubtitle({ videoId, file, language }) {
  /**
   * Upload a subtitle file for a video.
   * Params:
   *  - videoId: number | string (required)
   *  - file: File | Blob (required)
   *  - language: string (required, e.g., 'en', 'es')
   * Returns: SubtitleOut
   *
   * Note: According to provided OpenAPI, language is indicated as a path parameter,
   * but that is unusual. We follow spec where possible; if backend expects query or form,
   * adjust here accordingly in future iterations.
   */
  if (!videoId) throw new Error('uploadSubtitle: "videoId" is required');
  if (!file) throw new Error('uploadSubtitle: "file" is required');
  if (!language) throw new Error('uploadSubtitle: "language" is required');

  const form = new FormData();
  form.append('file', file);

  // The spec shows language as path parameter in "parameters", but the actual path shown is /videos/{video_id}/subtitles
  // without a {language} segment. To align with spec description that language belongs in path or query,
  // we'll send it as query param to be safe. If backend requires a different placement, update here.
  const searchParams = new URLSearchParams();
  searchParams.set('language', language);

  const url = `${BACKEND_URL}/videos/${encodeURIComponent(videoId)}/subtitles?${searchParams.toString()}`;
  const res = await fetch(url, {
    method: 'POST',
    body: form,
  });
  return handleJsonResponse(res);
}

// PUBLIC_INTERFACE
export const api = {
  /** Grouped API for convenient import */
  health,
  fetchVideos,
  fetchVideo,
  fetchSubtitles,
  uploadVideo,
  uploadSubtitle,
  streamUrl,
  subtitleFileUrl,
};

export default api;
