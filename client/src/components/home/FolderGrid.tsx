import type { Crumb } from './Breadcrumbs';

export type FolderItem = {
  id: string;
  name: string;
  updatedAt: string;
};

type FolderGridProps = {
  folders: FolderItem[];
  onOpen: (folder: FolderItem) => void;
  onRename: (folder: FolderItem) => void;
  onDelete: (folder: FolderItem) => void;
  trail: Crumb[];
};

export function FolderGrid({ folders, onOpen, onRename, onDelete, trail }: FolderGridProps) {
  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Folders</p>
          <p className="muted">Navigate and organize your space</p>
        </div>
        <span className="muted small">{trail.map((c) => c.label).join(' / ') || 'Root'}</span>
      </div>
      {folders.length === 0 ? (
        <div className="empty">No folders yet</div>
      ) : (
        <div className="folder-grid">
          {folders.map((folder) => (
            <div key={folder.id} className="folder-card">
              <button className="folder-card__main" onClick={() => onOpen(folder)}>
                <div className="folder-card__icon" aria-hidden>
                  <span>📁</span>
                </div>
                <div>
                  <div className="folder-card__name">{folder.name}</div>
                  <div className="folder-card__meta">Updated {folder.updatedAt}</div>
                </div>
              </button>
              <div className="folder-card__actions">
                <button type="button" onClick={() => onRename(folder)}>
                  Rename
                </button>
                <button type="button" onClick={() => onDelete(folder)} className="danger">
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
