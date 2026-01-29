import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

type UploadPanelProps = {
  onUpload: (files: File[], isPublic: boolean) => void;
  isUploading: boolean;
  uploadProgress: number;
};

const MAX_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB hard limit

export function UploadPanel({ onUpload, isUploading, uploadProgress }: UploadPanelProps) {
  const [isPublic, setIsPublic] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const wasUploading = useRef(false);

  useEffect(() => {
    if (wasUploading.current && !isUploading) {
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    wasUploading.current = isUploading;
  }, [isUploading]);

  const handleSelect = (files: FileList | null, resetInput: () => void) => {
    if (!files?.length) return;

    const oversize = Array.from(files).find((file) => file.size > MAX_SIZE_BYTES);
    if (oversize) {
      toast.error(`"${oversize.name}" exceeds the 2GB limit`);
      resetInput();
      return;
    }

    setSelectedFiles(Array.from(files));
    resetInput();
  };

  const handleStartUpload = () => {
    if (!selectedFiles.length || isUploading) return;
    onUpload(selectedFiles, isPublic);
  };

  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Upload</p>
          <p className="muted">Drop files here or browse to upload (max 2GB)</p>
        </div>
      </div>
      <label className={`upload ${isUploading ? 'upload--active' : ''}`} htmlFor="file-input">
        <span>
          {isUploading
            ? `Uploading... ${Math.round(uploadProgress)}%`
            : 'Drag & drop files or click to browse'}
        </span>
        {isUploading && (
          <div className="upload__runner">
            <div
              className="upload__runner-fill"
              style={{ width: `${Math.max(uploadProgress, 2)}%` }}
            />
          </div>
        )}
        <input
          id="file-input"
          type="file"
          multiple
          ref={fileInputRef}
          onChange={(e) => handleSelect(e.target.files, () => { e.target.value = ''; })}
          disabled={isUploading}
          hidden
        />
      </label>
      <div className="upload__options">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            disabled={isUploading}
          />
          <span>Make file public</span>
        </label>
      </div>
      <div className="upload__footer">
        <div className="muted small">
          {selectedFiles.length
            ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} ready to upload`
            : 'No files selected yet'}
        </div>
        <button
          type="button"
          className="primary"
          onClick={handleStartUpload}
          disabled={!selectedFiles.length || isUploading}
        >
          Upload
        </button>
      </div>
    </div>
  );
}
