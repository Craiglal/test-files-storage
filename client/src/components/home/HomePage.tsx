import { useMemo, useState } from 'react';
import './HomePage.scss';
import { Breadcrumbs, type Crumb } from './Breadcrumbs';
import { SearchBar } from './SearchBar';
import { FolderGrid, type FolderItem } from './FolderGrid';
import { FileList, type FileItem } from './FileList';
import { UploadPanel } from './UploadPanel';
import { RecentUploads } from './RecentUploads';
import { apiUrl, formatBytes, getOwnerId } from '../../lib/api';

type UploadRequestResponse = {
  fileId: string;
  uploadId: string;
  storageKey: string;
  partSize: number;
  parts: { partNumber: number; url: string }[];
};

export function HomePage() {
  const [query, setQuery] = useState('');
  const [trail, setTrail] = useState<Crumb[]>([{ id: 'root', label: 'Root' }]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const filteredFolders = useMemo(
    () => folders.filter((f) => f.name.toLowerCase().includes(query.toLowerCase())),
    [folders, query],
  );
  const filteredFiles = useMemo(
    () => files.filter((f) => f.name.toLowerCase().includes(query.toLowerCase())),
    [files, query],
  );

  const recentFiles = useMemo(() => files.slice(0, 5), [files]);

  const handleSearch = () => {
    // TODO: hook into API search
    console.log('search', query);
  };

  const handleOpenFolder = (folder: FolderItem) => {
    // TODO: load folder contents from API
    setTrail((prev) => [...prev, { id: folder.id, label: folder.name }]);
  };

  const handleRenameFolder = (folder: FolderItem) => {
    const nextName = prompt('Rename folder', folder.name);
    if (!nextName) return;
    setFolders((prev) => prev.map((f) => (f.id === folder.id ? { ...f, name: nextName } : f)));
  };

  const handleDeleteFolder = (folder: FolderItem) => {
    if (!confirm(`Delete folder "${folder.name}"?`)) return;
    setFolders((prev) => prev.filter((f) => f.id !== folder.id));
  };

  const handleCreateFolder = () => {
    const name = prompt('Folder name');
    if (!name) return;
    setFolders((prev) => [{ id: crypto.randomUUID(), name, updatedAt: 'just now' }, ...prev]);
  };

  const handleOpenFile = (file: FileItem) => {
    console.log('open file', file);
  };

  const handleRenameFile = (file: FileItem) => {
    const name = prompt('Rename file', file.name);
    if (!name) return;
    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, name } : f)));
  };

  const handleDeleteFile = (file: FileItem) => {
    if (!confirm(`Delete file "${file.name}"?`)) return;
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return;

    const folderId = trail[trail.length - 1]?.id;
    const targetFolderId = folderId === 'root' ? undefined : folderId;

    setIsUploading(true);
    try {
      const ownerId = getOwnerId();

      for (const file of Array.from(fileList)) {
        const requestResponse = await fetch(apiUrl('/api/files/upload-request'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            ownerId,
            folderId: targetFolderId,
            originalName: file.name,
            mime: file.type || 'application/octet-stream',
            size: file.size,
          }),
        });

        if (!requestResponse.ok) {
          const text = await requestResponse.text();
          throw new Error(text || 'Failed to start upload');
        }

        const requestJson = (await requestResponse.json()) as UploadRequestResponse;
        const uploadedParts: { partNumber: number; ETag: string }[] = [];

        for (let idx = 0; idx < requestJson.parts.length; idx += 1) {
          const part = requestJson.parts[idx];
          const start = idx * requestJson.partSize;
          const end = Math.min(file.size, start + requestJson.partSize);
          const chunk = file.slice(start, end);

          const uploadRes = await fetch(part.url, {
            method: 'PUT',
            body: chunk,
          });

          if (!uploadRes.ok) {
            throw new Error(`Part ${part.partNumber} upload failed`);
          }

          const etag = uploadRes.headers.get('ETag') ?? uploadRes.headers.get('etag');
          if (!etag) {
            throw new Error(`Missing ETag for part ${part.partNumber}`);
          }

          uploadedParts.push({ partNumber: part.partNumber, ETag: etag });
        }

        const completeRes = await fetch(apiUrl('/api/files/complete'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            fileId: requestJson.fileId,
            uploadId: requestJson.uploadId,
            parts: uploadedParts,
          }),
        });

        if (!completeRes.ok) {
          const text = await completeRes.text();
          throw new Error(text || 'Failed to complete upload');
        }

        const newFile: FileItem = {
          id: requestJson.fileId,
          name: file.name,
          sizeLabel: formatBytes(file.size),
          updatedAt: 'just now',
        };

        setFiles((prev) => [newFile, ...prev]);
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Upload failed';
      alert(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGoTo = (id: string) => {
    setTrail((prev) => prev.filter((crumb) => crumb.id === 'root' || crumb.id === id || prev.indexOf(crumb) < prev.findIndex((c) => c.id === id)));
    // TODO: load folder by id
  };

  return (
    <div className="page home">
      <header className="home__nav">
        <div className="home__brand">
          <div className="home__logo" aria-hidden>
            <span>☁️</span>
          </div>
          <div>
            <div className="home__brand-title">VReal Drive</div>
            <div className="home__brand-sub">Storage & Collaboration</div>
          </div>
        </div>
        <div className="home__actions">
          <button type="button" className="ghost" onClick={handleCreateFolder}>
            + New Folder
          </button>
        </div>
      </header>

      <main className="home__content">
        <div className="home__top">
          <div>
            <h1>Workspace</h1>
            <p className="muted">Search, upload, and organize your files</p>
            <Breadcrumbs trail={trail} onSelect={handleGoTo} />
          </div>
          <SearchBar value={query} onChange={setQuery} onSubmit={handleSearch} />
        </div>

        <section className="home__grid">
          <FolderGrid
            folders={filteredFolders}
            onOpen={handleOpenFolder}
            onRename={handleRenameFolder}
            onDelete={handleDeleteFolder}
            trail={trail}
          />
          <UploadPanel onUpload={handleUpload} isUploading={isUploading} />
          <FileList
            files={filteredFiles}
            onOpen={handleOpenFile}
            onRename={handleRenameFile}
            onDelete={handleDeleteFile}
          />
          <RecentUploads files={recentFiles} onOpen={handleOpenFile} />
        </section>
      </main>
    </div>
  );
}
