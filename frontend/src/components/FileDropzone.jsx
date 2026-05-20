import { UploadCloud, X } from 'lucide-react';
import { useState } from 'react';

export default function FileDropzone({ files, onFiles }) {
  const [dragging, setDragging] = useState(false);
  const addFiles = (incoming) => onFiles([...files, ...Array.from(incoming)]);

  return (
    <div
      className={`dropzone ${dragging ? 'dragging' : ''} ${files.length ? 'has-files' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        addFiles(event.dataTransfer.files);
      }}
    >
      <label>
        <UploadCloud size={16} />
        <span>Drop files or browse</span>
        <input type="file" multiple hidden onChange={(event) => addFiles(event.target.files)} />
      </label>
      {files.map((file, index) => (
        <span className="file-chip" key={`${file.name}-${index}`}>
          {file.name}
          <button type="button" onClick={() => onFiles(files.filter((_, fileIndex) => fileIndex !== index))}>
            <X size={12} />
          </button>
        </span>
      ))}
    </div>
  );
}
