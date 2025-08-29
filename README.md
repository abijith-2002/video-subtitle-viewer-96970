# Video Subtitles Frontend

## Introduction

### Overview
This React application displays a list of videos, allows selecting a video to play, and lets users enable or disable available subtitles. It communicates with the Video Subtitles Backend over HTTP. The UI is modern, minimal, and responsive.

### Scope
This README explains how to configure the frontend to talk to the backend, run locally and in deployment, and provides key usage notes.

## Key Features

- Fetch and display a list of videos from the backend
- Play selected video with browser-native controls
- List and toggle subtitle tracks, loading .vtt/.srt files from the backend
- Developer upload panel to add videos and optional subtitles
- Responsive layout for desktop and mobile
- Basic error handling banners

## Project Structure

- Container root: video_subtitles_frontend/
- Entry: src/index.js
- Main app: src/App.js (Header, VideoList, VideoPlayer, SubtitleSelector, UploadPanel)
- API client: src/api/client.js
- Config: src/config.js (reads REACT_APP_BACKEND_URL or window._BACKEND_URL)
- Styles: src/App.css, src/index.css
- Package scripts: package.json

## Environment Configuration

The frontend needs to know the backend base URL. You can configure it in two ways:

- Build-time env (preferred for CRA):
  - REACT_APP_BACKEND_URL=https://backend.example.com
- Runtime override (optional):
  - Inject window._BACKEND_URL in index.html or via a script tag before the app loads.

Resolution order (in src/config.js):
1) process.env.REACT_APP_BACKEND_URL
2) window._BACKEND_URL
3) Default http://localhost:8000

Example .env.local for local development:
- REACT_APP_BACKEND_URL=http://localhost:8000

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Install and Run
- cd video-subtitle-viewer-96970/video_subtitles_frontend
- npm install
- REACT_APP_BACKEND_URL=http://localhost:8000 npm start
  - Starts dev server on http://localhost:3000

The app expects the backend to be reachable at the configured URL. Start the backend first, then the frontend.

## Deployment Guidance

- Build the app:
  - REACT_APP_BACKEND_URL=https://api.yourdomain.com npm run build
- Serve the build/ directory using your preferred static hosting (e.g., Nginx, CDN, cloud static hosting).
- Alternatively, if you cannot set build-time env, provide a small runtime config script that sets window._BACKEND_URL prior to loading the app bundle.

CORS:
- The backend is permissive by default. In production, restrict the backend CORS to your frontend origin.

## Startup Order

1) Start PostgreSQL and the backend (confirm backend health: GET /).
2) Start the frontend and point it to the backend via REACT_APP_BACKEND_URL or window._BACKEND_URL.

## API Usage Examples

The frontend uses these backend endpoints (see backend README for full details and OpenAPI):

- GET {BACKEND_URL}/videos — list videos
- GET {BACKEND_URL}/videos/{id} — video details (includes stream and subtitle links)
- POST {BACKEND_URL}/videos/upload — upload a video (multipart/form-data, query title, optional description)
- GET {BACKEND_URL}/videos/{id}/stream — video streaming
- GET {BACKEND_URL}/videos/{id}/subtitles — list subtitles for a video
- POST {BACKEND_URL}/videos/{id}/subtitles?language=en — upload a subtitle
- GET {BACKEND_URL}/subtitles/{subtitle_id}/file — fetch raw subtitle file

Client helpers in src/api/client.js:
- api.fetchVideos(), api.fetchVideo(id), api.fetchSubtitles(videoId)
- api.uploadVideo({ file, title, description })
- api.uploadSubtitle({ videoId, file, language })
- api.streamUrl(videoId), api.subtitleFileUrl(subtitleId)

## Development Notes

- UploadPanel is intended for development and can be hidden or removed for production deployments.
- The default theme is light; a toggle allows switching to dark mode for previewing styles.
- Tests and linting configs follow Create React App conventions.

## Troubleshooting

- Calls fail with CORS in production: ensure backend CORS allow_origins includes your frontend origin or configure via a proxy.
- 404 for subtitle fetch or stream: verify files exist on backend storage and IDs are correct.
- Backend unreachable from frontend: confirm REACT_APP_BACKEND_URL (or window._BACKEND_URL) points to the correct backend URL and that network policies allow access.