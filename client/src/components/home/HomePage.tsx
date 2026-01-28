import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import './HomePage.scss';
import { Breadcrumbs, type Crumb } from './Breadcrumbs';
import { SearchBar } from './SearchBar';
import { FolderGrid, type FolderItem } from './FolderGrid';
import { FileList, type FileItem } from './FileList';
import { UploadPanel } from './UploadPanel';
import { apiUrl, formatBytes, getApiErrorMessage, getErrorMessage, getOwnerId } from '../../lib/api';

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [fileToRename, setFileToRename] = useState<FileItem | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [folderToDelete, setFolderToDelete] = useState<FolderItem | null>(null);
  const [folderToRename, setFolderToRename] = useState<FolderItem | null>(null);
  const [folderRenameValue, setFolderRenameValue] = useState('');
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const filteredFolders = useMemo(
    () => folders.filter((f) => f.name.toLowerCase().includes(query.toLowerCase())),
    [folders, query],
  );
  const filteredFiles = useMemo(
    () => files.filter((f) => f.name.toLowerCase().includes(query.toLowerCase())),
    [files, query],
  );

  useEffect(() => {
    const saved = localStorage.getItem('vreal_drive_trail');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as Crumb[];
      if (Array.isArray(parsed) && parsed.length) {
        const normalized = parsed
          .filter((c) => c?.id && c?.label)
          .map((c) => ({ id: String(c.id), label: String(c.label) }));
        if (!normalized.length) return;
        if (normalized[0].id !== 'root') {
          normalized.unshift({ id: 'root', label: 'Root' });
        }
        setTrail(normalized);
      }
    } catch {
      // ignore malformed cache
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('vreal_drive_trail', JSON.stringify(trail));
  }, [trail]);

  useEffect(() => {
    const loadContents = async () => {
      try {
        // const ownerId = getOwnerId();
        const currentFolderId = trail[trail.length - 1]?.id ?? 'root';
        const folderPath = currentFolderId || 'root';

        const res = await fetch(apiUrl(`/api/folders/${folderPath}/contents`), {
          credentials: 'include',
        });

        if (!res.ok) {
          const message = await getApiErrorMessage(res, 'Failed to load folder');
          throw new Error(message);
        }

        const data = (await res.json()) as {
          folders: { id: string; name: string; updatedAt: string }[];
          files: { id: string; originalName: string; size: string | number; updatedAt: string }[];
        };

        const mappedFolders: FolderItem[] = data.folders.map((f) => ({
          id: f.id,
          name: f.name,
          updatedAt: new Date(f.updatedAt).toLocaleString(),
        }));

        const mappedFiles: FileItem[] = data.files.map((item) => ({
          id: item.id,
          name: item.originalName,
          sizeLabel: formatBytes(Number(item.size)),
          updatedAt: new Date(item.updatedAt).toLocaleString(),
        }));

        setFolders(mappedFolders);
        setFiles(mappedFiles);
      } catch (err) {
        console.error(err);
        const message = getErrorMessage(err, 'Could not load folder');
        toast.error(message);
      }
    };

    loadContents();
  }, [trail]);

  const handleSearch = () => {
    // TODO: hook into API search
    console.log('search', query);
  };

  const handleOpenFolder = (folder: FolderItem) => {
    setTrail((prev) => [...prev, { id: folder.id, label: folder.name }]);
  };

  const handleRenameFolder = (folder: FolderItem) => {
    setFolderToRename(folder);
    setFolderRenameValue(folder.name);
  };

  const handleDeleteFolder = (folder: FolderItem) => {
    setFolderToDelete(folder);
  };

  const handleCreateFolder = () => {
    setNewFolderName('');
    setIsCreateFolderOpen(true);
  };

  const confirmCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      const ownerId = getOwnerId();
      const parentId = trail[trail.length - 1]?.id;
      const body: Record<string, unknown> = { name, ownerId };
      if (parentId && parentId !== 'root') {
        body.parentId = parentId;
      }

      const res = await fetch(apiUrl('/api/folders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const message = await getApiErrorMessage(res, 'Failed to create folder');
        throw new Error(message);
      }

      const created = (await res.json()) as { id: string; name: string; updatedAt: string };
      const mapped: FolderItem = {
        id: created.id,
        name: created.name,
        updatedAt: new Date(created.updatedAt).toLocaleString(),
      };

      setFolders((prev) => [mapped, ...prev]);
      toast.success('Folder created');
      setIsCreateFolderOpen(false);
      setNewFolderName('');
    } catch (err) {
      console.error(err);
      const message = getErrorMessage(err, 'Failed to create folder');
      toast.error(message);
    }
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return;

    try {
      const res = await fetch(apiUrl(`/api/folders/${folderToDelete.id}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const message = await getApiErrorMessage(res, 'Failed to delete folder');
        throw new Error(message);
      }

      setFolders((prev) => prev.filter((f) => f.id !== folderToDelete.id));
      setFiles((prev) => prev.filter((f) => f.id !== folderToDelete.id));
      toast.success(`Deleted ${folderToDelete.name}`);
      setFolderToDelete(null);
    } catch (err) {
      console.error(err);
      const message = getErrorMessage(err, 'Failed to delete folder');
      toast.error(message);
    }
  };

  const confirmRenameFolder = async () => {
    if (!folderToRename) return;
    const nextName = folderRenameValue.trim();
    if (!nextName) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      const res = await fetch(apiUrl(`/api/folders/${folderToRename.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: nextName }),
      });

      if (!res.ok) {
        const message = await getApiErrorMessage(res, 'Failed to rename folder');
        throw new Error(message);
      }

      setFolders((prev) => prev.map((f) => (f.id === folderToRename.id ? { ...f, name: nextName, updatedAt: 'just now' } : f)));
      setTrail((prev) => prev.map((crumb) => (crumb.id === folderToRename.id ? { ...crumb, label: nextName } : crumb)));
      toast.success('Folder renamed');
      setFolderToRename(null);
      setFolderRenameValue('');
    } catch (err) {
      console.error(err);
      const message = getErrorMessage(err, 'Failed to rename folder');
      toast.error(message);
    }
  };

  const handleOpenFile = (file: FileItem) => {
    console.log('open file', file);
  };

  const handleRenameFile = (file: FileItem) => {
    setFileToRename(file);
    setRenameValue(file.name);
  };

  const handleDeleteFile = (file: FileItem) => {
    setFileToDelete(file);
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      const res = await fetch(apiUrl(`/api/files/${fileToDelete.id}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const message = await getApiErrorMessage(res, 'Failed to delete file');
        throw new Error(message);
      }

      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      toast.success(`Deleted ${fileToDelete.name}`);
      setFileToDelete(null);
    } catch (err) {
      console.error(err);
      const message = getErrorMessage(err, 'Failed to delete file');
      toast.error(message);
    }
  };

  const confirmRenameFile = async () => {
    if (!fileToRename) return;
    const nextName = renameValue.trim();
    if (!nextName) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      const res = await fetch(apiUrl(`/api/files/${fileToRename.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: nextName }),
      });

      if (!res.ok) {
        const message = await getApiErrorMessage(res, 'Failed to rename file');
        throw new Error(message);
      }

      setFiles((prev) => prev.map((f) => (f.id === fileToRename.id ? { ...f, name: nextName, updatedAt: 'just now' } : f)));
      toast.success('File renamed');
      setFileToRename(null);
      setRenameValue('');
    } catch (err) {
      console.error(err);
      const message = getErrorMessage(err, 'Failed to rename file');
      toast.error(message);
    }
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return;

    const filesArray = Array.from(fileList);
    const totalBytes = filesArray.reduce((sum, f) => sum + f.size, 0) || 1;
    let uploadedBytes = 0;

    setUploadProgress(0);

    const folderId = trail[trail.length - 1]?.id;
    const targetFolderId = folderId === 'root' ? undefined : folderId;

    setIsUploading(true);
    try {
      const ownerId = getOwnerId();

      for (const file of filesArray) {
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
          const message = await getApiErrorMessage(requestResponse, 'Failed to start upload');
          throw new Error(message);
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

          uploadedBytes += chunk.size;
          setUploadProgress(Math.round((uploadedBytes / totalBytes) * 100));

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
          const message = await getApiErrorMessage(completeRes, 'Failed to complete upload');
          throw new Error(message);
        }

        const newFile: FileItem = {
          id: requestJson.fileId,
          name: file.name,
          sizeLabel: formatBytes(file.size),
          updatedAt: 'just now',
        };

        setFiles((prev) => [newFile, ...prev]);
        toast.success(`Uploaded ${file.name}`);
      }

      setUploadProgress(100);
    } catch (err) {
      console.error(err);
      const message = getErrorMessage(err, 'Upload failed');
      toast.error(message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleGoTo = (id: string) => {
    setTrail((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx === -1) return prev;
      return prev.slice(0, idx + 1);
    });
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
          <UploadPanel onUpload={handleUpload} isUploading={isUploading} uploadProgress={uploadProgress} />
          <FileList
            files={filteredFiles}
            onOpen={handleOpenFile}
            onRename={handleRenameFile}
            onDelete={handleDeleteFile}
          />
        </section>
      </main>

      {isCreateFolderOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Create folder</h3>
            <label className="modal__field">
              <span className="muted small">Name</span>
              <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} />
            </label>
            <div className="modal__actions">
              <button type="button" onClick={() => setIsCreateFolderOpen(false)}>
                Cancel
              </button>
              <button type="button" onClick={confirmCreateFolder}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {folderToDelete && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Delete folder</h3>
            <p className="muted">Are you sure you want to delete "{folderToDelete.name}"?</p>
            <div className="modal__actions">
              <button type="button" onClick={() => setFolderToDelete(null)}>
                Cancel
              </button>
              <button type="button" className="danger" onClick={confirmDeleteFolder}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {folderToRename && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Rename folder</h3>
            <label className="modal__field">
              <span className="muted small">New name</span>
              <input value={folderRenameValue} onChange={(e) => setFolderRenameValue(e.target.value)} />
            </label>
            <div className="modal__actions">
              <button type="button" onClick={() => setFolderToRename(null)}>
                Cancel
              </button>
              <button type="button" onClick={confirmRenameFolder}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {fileToDelete && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Delete file</h3>
            <p className="muted">Are you sure you want to delete "{fileToDelete.name}"?</p>
            <div className="modal__actions">
              <button type="button" onClick={() => setFileToDelete(null)}>
                Cancel
              </button>
              <button type="button" className="danger" onClick={confirmDeleteFile}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {fileToRename && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Rename file</h3>
            <label className="modal__field">
              <span className="muted small">New name</span>
              <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
            </label>
            <div className="modal__actions">
              <button type="button" onClick={() => setFileToRename(null)}>
                Cancel
              </button>
              <button type="button" onClick={confirmRenameFile}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
