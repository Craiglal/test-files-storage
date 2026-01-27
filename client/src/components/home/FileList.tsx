export type FileItem = {
  id: string;
  name: string;
  sizeLabel: string;
  updatedAt: string;
};

type FileListProps = {
  files: FileItem[];
  onOpen: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
};

export function FileList({ files, onOpen, onRename, onDelete }: FileListProps) {
  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Files</p>
          <p className="muted">Recent uploads and documents</p>
        </div>
      </div>
      {files.length === 0 ? (
        <div className="empty">No files yet</div>
      ) : (
        <div className="file-list">
          {files.map((file) => (
            <div key={file.id} className="file-row">
              <button className="file-row__main" onClick={() => onOpen(file)}>
                <div className="file-row__icon">📄</div>
                <div className="file-row__body">
                  <div className="file-row__name">{file.name}</div>
                  <div className="file-row__meta">{file.sizeLabel} · Updated {file.updatedAt}</div>
                </div>
              </button>
              <div className="file-row__actions">
                <button type="button" onClick={() => onRename(file)}>
                  Rename
                </button>
                <button type="button" className="danger" onClick={() => onDelete(file)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
