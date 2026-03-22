export function PreviewPlayer({ embedUrl, thumbnailUrl, title }: { embedUrl?: string; thumbnailUrl?: string; title: string }) {
  if (embedUrl) {
    return (
      <div className="preview-player">
        <iframe src={embedUrl} title={title} allow="autoplay; fullscreen" allowFullScreen />
      </div>
    );
  }
  return (
    <div className="preview-player preview-player--fallback" style={{ backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : undefined }}>
      <span>No public preview available yet.</span>
    </div>
  );
}
