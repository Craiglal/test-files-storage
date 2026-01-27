import type { FileItem } from './FileList';

type RecentUploadsProps = {
  files: FileItem[];
  onOpen: (file: FileItem) => void;
};

export function RecentUploads({ files, onOpen }: RecentUploadsProps) {
  const display = files.slice(0, 5);

  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Recent uploads</p>
          <p className="muted">Latest files you added</p>
        </div>
      </div>
      {display.length === 0 ? (
        <div className="empty">No recent uploads</div>
      ) : (
        <div className="recent-list">
          {display.map((file) => (
            <button key={file.id} className="recent-item" onClick={() => onOpen(file)}>
              <span className="recent-item__icon" aria-hidden>
                📄
              </span>
              <span className="recent-item__name">{file.name}</span>
              <span className="recent-item__meta">{file.sizeLabel} · {file.updatedAt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
