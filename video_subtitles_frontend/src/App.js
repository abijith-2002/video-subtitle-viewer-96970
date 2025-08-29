import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import './index.css';
import { api, fetchSubtitles, fetchVideos, streamUrl } from './api/client';

/**
 * UI Components: ErrorBanner, Header, VideoList, SubtitleSelector, VideoPlayer, UploadPanel (optional)
 * The app follows a light, minimal, modern theme with responsive split on desktop and stacked on mobile.
 */

// PUBLIC_INTERFACE
export function ErrorBanner({ message, onClose }) {
  /** Render a dismissible error banner. */
  if (!message) return null;
  return (
    <div className="banner banner-error" role="alert" aria-live="assertive">
      <span>{message}</span>
      <button className="btn btn-ghost" onClick={onClose} aria-label="Dismiss error">✕</button>
    </div>
  );
}

// PUBLIC_INTERFACE
export function Header({ theme, onToggleTheme }) {
  /** App header with title and theme toggle. */
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo-dot" aria-hidden="true" />
        <h1 className="title">Video Subtitle Viewer</h1>
      </div>
      <div className="header-right">
        <button
          className="btn"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title="Toggle theme"
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
    </header>
  );
}

// PUBLIC_INTERFACE
export function VideoList({ videos, selectedId, onSelect, loading }) {
  /** Sidebar list of available videos. */
  return (
    <div className="panel video-list">
      <div className="panel-header">
        <h2 className="panel-title">Videos</h2>
      </div>
      <div className="panel-content scroll">
        {loading && <div className="skeleton skeleton-line" />}
        {!loading && videos.length === 0 && (
          <div className="muted">No videos available.</div>
        )}
        {!loading &&
          videos.map((v) => (
            <button
              key={v.id}
              className={`video-item ${selectedId === v.id ? 'active' : ''}`}
              onClick={() => onSelect(v)}
              title={v.title}
            >
              <div className="video-item-title">{v.title}</div>
              {v.description ? (
                <div className="video-item-desc">{v.description}</div>
              ) : (
                <div className="video-item-desc muted">No description</div>
              )}
            </button>
          ))}
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function SubtitleSelector({ subtitles, activeSubtitleId, onChange }) {
  /** Control to choose which subtitle track to use (or none). */
  const hasAny = subtitles && subtitles.length > 0;
  return (
    <div className="subtitle-selector">
      <label htmlFor="subtitle-select" className="label">
        Subtitles
      </label>
      <select
        id="subtitle-select"
        className="select"
        value={activeSubtitleId || ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        disabled={!hasAny}
      >
        <option value="">Off</option>
        {subtitles.map((s) => (
          <option key={s.id} value={s.id}>
            {s.language?.toUpperCase?.() || `#${s.id}`}
          </option>
        ))}
      </select>
    </div>
  );
}

// PUBLIC_INTERFACE
export function VideoPlayer({ video, subtitles, activeSubtitleId, onActiveSubtitleChange }) {
  /** Video element with dynamic <track> entries for subtitles. */
  const videoRef = useRef(null);

  // Build track objects the browser can use
  const tracks = useMemo(() => {
    return (subtitles || []).map((s) => ({
      id: s.id,
      kind: 'subtitles',
      src: api.subtitleFileUrl(s.id),
      srcLang: (s.language || 'und').toLowerCase(),
      label: s.language?.toUpperCase?.() || `Subtitle ${s.id}`,
      default: activeSubtitleId === s.id,
    }));
  }, [subtitles, activeSubtitleId]);

  useEffect(() => {
    // When active subtitle changes, toggle track mode
    const el = videoRef.current;
    if (!el || !el.textTracks) return;

    // Turn all off first
    for (const track of el.textTracks) {
      track.mode = 'disabled';
    }
    // Enable the selected one
    if (activeSubtitleId && subtitles?.length) {
      const idx = subtitles.findIndex((s) => s.id === activeSubtitleId);
      if (idx >= 0 && el.textTracks[idx]) {
        el.textTracks[idx].mode = 'showing';
      }
    }
  }, [activeSubtitleId, subtitles]);

  if (!video) {
    return (
      <div className="video-placeholder">
        <div className="muted">Select a video to begin</div>
      </div>
    );
  }

  return (
    <div className="player-wrap">
      <video
        key={video.id}
        ref={videoRef}
        className="video"
        controls
        preload="metadata"
        src={streamUrl(video.id)}
      >
        {tracks.map((t) => (
          <track
            key={t.id}
            kind={t.kind}
            src={t.src}
            srcLang={t.srcLang}
            label={t.label}
            default={t.default}
          />
        ))}
        Your browser does not support the video tag.
      </video>
      <div className="player-controls">
        <SubtitleSelector
          subtitles={subtitles || []}
          activeSubtitleId={activeSubtitleId}
          onChange={onActiveSubtitleChange}
        />
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function UploadPanel({ onUploaded }) {
  /**
   * Developer utility: upload video and optional subtitle.
   * This is optional and can be hidden in production as needed.
   */
  const [vTitle, setVTitle] = useState('');
  const [vDesc, setVDesc] = useState('');
  const [vFile, setVFile] = useState(null);
  const [sFile, setSFile] = useState(null);
  const [sLang, setSLang] = useState('en');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    setErr('');
    if (!vFile || !vTitle) {
      setErr('Please provide a video file and title.');
      return;
    }
    try {
      setBusy(true);
      const video = await api.uploadVideo({ file: vFile, title: vTitle, description: vDesc || undefined });
      if (sFile) {
        try {
          await api.uploadSubtitle({ videoId: video.id, file: sFile, language: sLang || 'en' });
        } catch (se) {
          // Non-fatal error for subtitle upload
          console.error(se);
        }
      }
      setVTitle('');
      setVDesc('');
      setVFile(null);
      setSFile(null);
      onUploaded?.(video);
    } catch (e2) {
      setErr(e2.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel upload-panel">
      <div className="panel-header">
        <h2 className="panel-title">Upload (dev)</h2>
      </div>
      <div className="panel-content">
        {err && <div className="banner banner-error">{err}</div>}
        <form onSubmit={handleUpload} className="form-grid">
          <div className="form-row">
            <label className="label">Title</label>
            <input className="input" value={vTitle} onChange={(e) => setVTitle(e.target.value)} placeholder="My great video" />
          </div>
          <div className="form-row">
            <label className="label">Description</label>
            <input className="input" value={vDesc} onChange={(e) => setVDesc(e.target.value)} placeholder="Optional" />
          </div>
          <div className="form-row">
            <label className="label">Video File</label>
            <input className="input" type="file" accept="video/*" onChange={(e) => setVFile(e.target.files?.[0] || null)} />
          </div>
          <div className="form-row">
            <label className="label">Subtitle File</label>
            <input className="input" type="file" accept=".vtt,.srt,text/vtt" onChange={(e) => setSFile(e.target.files?.[0] || null)} />
          </div>
          <div className="form-row">
            <label className="label">Subtitle Lang</label>
            <input className="input small" value={sLang} onChange={(e) => setSLang(e.target.value)} placeholder="en" />
          </div>
          <div className="form-row">
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Main application component with responsive layout and state management. */
  const [theme, setTheme] = useState('light');
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [activeSubtitleId, setActiveSubtitleId] = useState(null);
  const [error, setError] = useState('');

  // Apply theme to root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  // Load initial videos
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingVideos(true);
        const list = await fetchVideos();
        if (cancelled) return;
        setVideos(list);
        if (list.length > 0) {
          setSelectedVideo(list[0]);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to fetch videos');
      } finally {
        if (!cancelled) setLoadingVideos(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load subtitles when selected video changes
  useEffect(() => {
    let cancelled = false;
    if (!selectedVideo) {
      setSubtitles([]);
      setActiveSubtitleId(null);
      return () => {};
    }
    (async () => {
      try {
        const subs = await fetchSubtitles(selectedVideo.id);
        if (cancelled) return;
        setSubtitles(subs);
        // Set default active subtitle if available
        setActiveSubtitleId(subs?.[0]?.id ?? null);
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Failed to fetch subtitles');
          setSubtitles([]);
          setActiveSubtitleId(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedVideo]);

  const onVideoSelect = (v) => {
    setSelectedVideo(v);
  };

  const dismissError = () => setError('');

  const handleUploaded = (video) => {
    // Prepend newly uploaded video; select it
    setVideos((prev) => [video, ...prev]);
    setSelectedVideo(video);
  };

  return (
    <div className="app-root">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <main className="layout">
        <aside className="sidebar">
          <VideoList
            videos={videos}
            selectedId={selectedVideo?.id ?? null}
            onSelect={onVideoSelect}
            loading={loadingVideos}
          />
          <UploadPanel onUploaded={handleUploaded} />
        </aside>
        <section className="content">
          <ErrorBanner message={error} onClose={dismissError} />
          <VideoPlayer
            video={selectedVideo}
            subtitles={subtitles}
            activeSubtitleId={activeSubtitleId}
            onActiveSubtitleChange={setActiveSubtitleId}
          />
        </section>
      </main>
      <footer className="app-footer">
        <span className="muted">Powered by React • Minimal, modern UI</span>
      </footer>
    </div>
  );
}

export default App;
