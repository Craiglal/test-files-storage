type UploadPanelProps = {
  onUpload: (files: FileList | null) => void;
  isUploading: boolean;
};

export function UploadPanel({ onUpload, isUploading }: UploadPanelProps) {
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
          onChange={(e) => onUpload(e.target.files)}
          disabled={isUploading}
          hidden
        />
      </label>
    </div>
  );
}
