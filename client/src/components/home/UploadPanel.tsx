import { useState } from 'react';
import { toast } from 'react-toastify';

type UploadPanelProps = {
  onUpload: (files: FileList | null, isPublic: boolean) => void;
  isUploading: boolean;
  uploadProgress: number;
};

const MAX_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB hard limit

export function UploadPanel({ onUpload, isUploading, uploadProgress }: UploadPanelProps) {
  const [isPublic, setIsPublic] = useState(false);

  const handleSelect = (files: FileList | null, resetInput: () => void) => {
    if (!files?.length) {
      onUpload(files, isPublic);
      return;
    }

    const oversize = Array.from(files).find((file) => file.size > MAX_SIZE_BYTES);
    if (oversize) {
      toast.error(`"${oversize.name}" exceeds the 2GB limit`);
      resetInput();
      return;
    }

    onUpload(files, isPublic);
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
    </div>
  );
}
