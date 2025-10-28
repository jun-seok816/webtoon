import React, { ChangeEvent, useMemo, useState } from "react";

const menuItems = [
  "File",
  "Edit",  
];

type FileUploadModalProps = {
  onClose: () => void;
  onConfirm: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  selectedFiles: File[];
};

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  onClose,
  onConfirm,
  onFileChange,
  selectedFiles,
}) => {
  const helperText = useMemo(() => {
    if (selectedFiles.length === 0) {
      return "PNG, JPG, WEBP, PSD 형식의 파일을 선택하세요.";
    }

    return `${selectedFiles.length}개의 파일이 선택되었습니다.`;
  }, [selectedFiles]);

  return (
    <div
      className="menu-bar__modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-upload-title"
    >
      <div className="menu-bar__modal">
        <header className="menu-bar__modal-header">
          <h2 id="file-upload-title">파일 업로드</h2>
          <button
            type="button"
            className="menu-bar__modal-close"
            onClick={onClose}
            aria-label="파일 업로드 모달 닫기"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </header>
        <div className="menu-bar__modal-body">
          <label className="menu-bar__file-input">
            <span className="menu-bar__file-input-label">
              이미지 또는 PSD 파일을 선택하세요
            </span>
            <input
              type="file"
              accept="image/*,.psd"
              multiple
              onChange={onFileChange}
            />
          </label>
          <p className="menu-bar__file-helper">{helperText}</p>
          {selectedFiles.length > 0 && (
            <ul className="menu-bar__file-list">
              {selectedFiles.map((file) => (
                <li key={file.name}>{file.name}</li>
              ))}
            </ul>
          )}
        </div>
        <footer className="menu-bar__modal-footer">
          <button
            type="button"
            className="menu-bar__modal-secondary"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="menu-bar__modal-primary"
            onClick={onConfirm}
          >
            업로드
          </button>
        </footer>
      </div>
    </div>
  );
};

const MenuBar: React.FC = () => {
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileMenuClick = () => {
    setIsFileModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsFileModalOpen(false);
    setSelectedFiles([]);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setSelectedFiles(files);
  };

  const handleConfirmUpload = () => {
    if (selectedFiles.length === 0) {
      setIsFileModalOpen(false);
      return;
    }

    console.info("선택된 파일:", selectedFiles);
    setIsFileModalOpen(false);
    setSelectedFiles([]);
  };

  return (
    <>
      <nav className="menu-bar">
        <div className="menu-bar__group">
          {menuItems.map((item) => (
            <button
              key={item}
              type="button"
              className="menu-item"
              onClick={item === "File" ? handleFileMenuClick : undefined}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="menu-bar__workspace">
          <span className="workspace-label">Workspace:</span>
          <select defaultValue="toon-compositing">
            <option value="toon-compositing">Toon Compositing</option>
            <option value="layout">Layout</option>
            <option value="color">Color</option>
          </select>
          <button className="menu-icon" title="Customize workspace" type="button">
            <i className="bi bi-columns-gap" aria-hidden="true" />
          </button>
          <button className="menu-icon" title="Search commands" type="button">
            <i className="bi bi-search" aria-hidden="true" />
          </button>
        </div>
      </nav>
      {isFileModalOpen && (
        <FileUploadModal
          onClose={handleCloseModal}
          onConfirm={handleConfirmUpload}
          onFileChange={handleFileChange}
          selectedFiles={selectedFiles}
        />
      )}
    </>
  );
};

export default MenuBar;
