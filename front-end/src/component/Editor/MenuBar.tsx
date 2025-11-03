import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import throttle from "lodash/throttle";
import { ImageItem, Upload } from "@jsLib/class/Upload";
import { Loading } from "@jsLib/class/Loading";
import { Editor } from "./Layout";

const menuItems = ["File", "Edit"];

type MenuBarProps = {
  editor: Editor;
};

type FileUploadModalProps = {
  onClose: () => void;
  onConfirm: () => Promise<void>;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  selectedFiles: File[];
  isUploading: boolean;
};

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  onClose,
  onConfirm,
  onFileChange,
  selectedFiles,
  isUploading,
}) => {
  const helperText = useMemo(() => {
    if (isUploading) {
      return "업로드 중입니다. 잠시만 기다려 주세요.";
    }

    if (selectedFiles.length === 0) {
      return "PNG, JPG, WEBP, PSD 형식의 파일을 선택하세요.";
    }

    return `${selectedFiles.length}개의 파일이 선택되었습니다.`;
  }, [isUploading, selectedFiles]);

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
            disabled={isUploading}
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
            disabled={isUploading}
          >
            취소
          </button>
          <button
            type="button"
            className="menu-bar__modal-primary"
            onClick={() => {
              void onConfirm();
            }}
            disabled={isUploading || selectedFiles.length === 0}
          >
            {isUploading ? "업로드 중..." : "업로드"}
          </button>
        </footer>
      </div>
    </div>
  );
};

const MenuBar: React.FC<MenuBarProps> = ({ editor }) => {
  const upload: Upload | undefined = editor.pt_upload;
  const loading: Loading | undefined = editor.pt_loading;
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const throttledRender = useMemo(() => {
    if (!upload) return null;
    return throttle(() => {
      upload.im_forceRender();
    }, 100);
  }, [upload]);

  useEffect(() => {
    return () => {
      throttledRender?.cancel();
    };
  }, [throttledRender]);

  const makeThumbnail = useCallback(async (file: File, maxSide = 1200) => {
    const bmp = await createImageBitmap(file);
    let { width, height } = bmp;
    const scale = Math.min(1, maxSide / Math.max(width, height));
    if (scale < 1) {
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bmp.close();
      throw new Error("캔버스 컨텍스트를 생성할 수 없습니다.");
    }
    ctx.drawImage(bmp, 0, 0, width, height);
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error("썸네일을 생성하지 못했습니다."));
        },
        "image/jpeg",
        0.85
      );
    });
    bmp.close();
    return blob;
  }, []);

  const scheduleThumbnailUpdate = useCallback(
    (item: ImageItem) => {
      if (!upload) return;

      const run = async () => {
        try {
          const thumbBlob = await makeThumbnail(item.file);
          const previewUrl = URL.createObjectURL(thumbBlob);
          const exists = upload.pt_items.some((entry) => entry.id === item.id);

          if (!exists) {
            URL.revokeObjectURL(previewUrl);
            return;
          }

          const previousUrl = item.previewUrl;
          item.previewUrl = previewUrl;
          upload.im_forceRender();
          throttledRender?.();

          if (previousUrl) {
            URL.revokeObjectURL(previousUrl);
          }
        } catch (error) {
          console.error(error);
        }
      };

      if (typeof window !== "undefined") {
        const maybeRIC = (window as unknown as {
          requestIdleCallback?: (callback: () => void) => number;
        }).requestIdleCallback;

        if (typeof maybeRIC === "function") {
          maybeRIC(() => {
            void run();
          });
          return;
        }
      }

      setTimeout(() => {
        void run();
      }, 16);
    },
    [makeThumbnail, throttledRender, upload]
  );

  const addFiles = useCallback(
    async (files: File[]) => {
      if (!upload || !loading) return;
      const imageFiles = files.filter((file) => {
        if (file.type.startsWith("image/")) return true;
        return file.name.toLowerCase().endsWith(".psd");
      });
      if (imageFiles.length === 0) return;

      const total = imageFiles.length;
      let completed = 0;
      loading.is_loading = true;
      upload.im_forceRender();

      try {
        const next = imageFiles.map((file, index) => {
          const id =
            globalThis.crypto?.randomUUID?.() ??
            `${Date.now()}-${Math.random()}-${index}`;

          completed += 1;
          loading.iv_per = Math.round((completed / total) * 100);
          throttledRender?.();

          return {
            id,
            file,
            previewUrl: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
            type: file.type,
          };
        });

        upload.pt_items = [...upload.pt_items, ...next];
        next.forEach((item) => scheduleThumbnailUpdate(item));
      } catch (error) {
        console.error(error);
      } finally {
        loading.iv_per = 0;
        loading.is_loading = false;
        upload.im_forceRender();
      }
    },
    [loading, scheduleThumbnailUpdate, throttledRender, upload]
  );

  const handleFileMenuClick = () => {
    setIsFileModalOpen(true);
  };

  const handleCloseModal = useCallback(() => {
    if (isUploading) return;
    setIsFileModalOpen(false);
    setSelectedFiles([]);
  }, [isUploading]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    setSelectedFiles(files);
  };

  const handleConfirmUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      setIsFileModalOpen(false);
      return;
    }

    if (!upload || !loading) {
      console.warn("Upload 또는 Loading 인스턴스가 전달되지 않았습니다.");
      setIsFileModalOpen(false);
      setSelectedFiles([]);
      return;
    }

    setIsUploading(true);
    try {
      await addFiles(selectedFiles);
    } finally {
      setIsUploading(false);
      setIsFileModalOpen(false);
      setSelectedFiles([]);
    }
  }, [addFiles, loading, selectedFiles, upload]);

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
          isUploading={isUploading}
        />
      )}
    </>
  );
};

export default MenuBar;
