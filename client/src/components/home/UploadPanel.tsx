import { toast } from 'react-toastify';

type UploadPanelProps = {
  onUpload: (files: FileList | null) => void;
  isUploading: boolean;
  uploadProgress: number;
};

const MAX_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB hard limit

export function UploadPanel({ onUpload, isUploading, uploadProgress }: UploadPanelProps) {
  const handleSelect = (files: FileList | null, resetInput: () => void) => {
    if (!files?.length) {
      onUpload(files);
      return;
    }

    const oversize = Array.from(files).find((file) => file.size > MAX_SIZE_BYTES);
    if (oversize) {
      toast.error(`"${oversize.name}" exceeds the 2GB limit`);
      resetInput();
      return;
    }

    onUpload(files);
  };

  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Upload</p>
          <p className="muted">Drop files here or browse to upload (max 2GB)</p>
        </div>
      </div>
      <label className="upload" htmlFor="file-input">
        <span>{isUploading ? 'Uploading...' : 'Drag & drop files or click to browse'}</span>
        <input
          id="file-input"
          type="file"
          multiple
          onChange={(e) => handleSelect(e.target.files, () => { e.target.value = ''; })}
          disabled={isUploading}
          hidden
        />
      </label>
      {isUploading && (
        <div className="upload__progress">
          <progress value={uploadProgress} max={100} />
          <span className="muted small">{uploadProgress}%</span>
        </div>
      )}
    </div>
  );
}
