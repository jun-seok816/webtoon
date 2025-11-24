import React, { ChangeEvent, useCallback, useEffect, useMemo } from "react";
import throttle from "lodash/throttle";
import { ImageItem, Upload } from "@jsLib/class/Upload";
import { Loading } from "@jsLib/class/Loading";
import { Editor } from "./Layout";
import UploadHistoryModal from "./UploadHistoryModal";
import "./MenuBar.scss";

type MenuBarProps = {
  editor: Editor;
};

const FileUploadModal: React.FC<MenuBarProps> = ({ editor }) => {
  const upload: Upload | undefined = editor.upload;
  const loading: Loading | undefined = editor.loading;
  const uiStore = editor.ui;
  const selectedFiles = uiStore.selectedFiles;
  const isUploading = uiStore.isUploading;
  const title = uiStore.uploadTitle;

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
        const next: ImageItem[] = imageFiles.map((file, index) => {
          const id =
            globalThis.crypto?.randomUUID?.() ??
            `${Date.now()}-${Math.random()}-${index}`;

          completed += 1;
          loading.iv_per = Math.round((completed / total) * 100);
          throttledRender?.();

          return {
            id,
            file,
            name: file.name,
            size: file.size,
            type: file.type,
          };
        });

        upload.pt_items = [...upload.pt_items, ...next];
      } catch (error) {
        console.error(error);
      } finally {
        loading.iv_per = 0;
        loading.is_loading = false;
        upload.im_forceRender();
      }
    },
    [loading, throttledRender, upload]
  );

  const resetModalState = useCallback(() => {
    uiStore.resetUploadModalState();
  }, [uiStore]);

  const handleClose = useCallback(() => {
    if (uiStore.isUploading) return;
    resetModalState();
  }, [resetModalState, uiStore]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    uiStore.setSelectedFiles(files);
  };

  const handleTitleChange = (value: string) => {
    uiStore.setUploadTitle(value);
  };

  const handleConfirm = useCallback(async () => {
    const files = uiStore.selectedFiles;
    if (files.length === 0) {
      resetModalState();
      return;
    }

    if (!upload || !loading) {
      console.warn("Upload 또는 Loading 인스턴스가 전달되지 않았습니다.");
      resetModalState();
      return;
    }

    const ensuredUpload = upload;
    const ensuredLoading = loading;
    uiStore.setIsUploading(true);
    try {
      const prevCount = ensuredUpload.pt_items.length;
      ensuredUpload.pt_Title = uiStore.uploadTitle;
      await addFiles(files);
      const appendedCount = ensuredUpload.pt_items.length - prevCount;

      if (appendedCount <= 0) {
        Editor.im_toast("추가된 파일이 없습니다.", "warn");
        return;
      }

      ensuredLoading.is_loading = true;
      ensuredUpload.im_forceRender();

      const response = await ensuredUpload.im_UploadFormData("/api/uploads", {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (event) => {
          if (!event.total) {
            return;
          }
          ensuredLoading.iv_per = Math.round(
            (event.loaded / event.total) * 100
          );
          ensuredUpload.im_forceRender();
        },
      });

      if (response?.data?.success) {
        const count = appendedCount;
        Editor.im_toast(`${count}개 파일 업로드 완료`, "success");
      } else {
        Editor.im_toast(
          "이미지 업로드가 완료되었는지 확인이 필요합니다.",
          "info"
        );
      }
    } catch (error) {
      console.error(error);
      Editor.im_toast("이미지 업로드에 실패했습니다.", "error");
    } finally {
      ensuredLoading.iv_per = 0;
      ensuredLoading.is_loading = false;
      ensuredUpload.im_forceRender();
      uiStore.setIsUploading(false);
      resetModalState();
    }
  }, [addFiles, loading, resetModalState, uiStore, upload]);

  if (!upload || !loading) {
    return null;
  }

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
            onClick={handleClose}
            aria-label="파일 업로드 모달 닫기"
            disabled={isUploading}
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </header>
        <div className="menu-bar__modal-body">
          <label className="menu-bar__title-input">
            <span className="menu-bar__title-input-label">작품 제목</span>
            <input
              type="text"
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              placeholder="업로드할 웹툰 제목을 입력하세요"
              disabled={isUploading}
            />
          </label>
          <label className="menu-bar__file-input">
            <span className="menu-bar__file-input-label">
              이미지 또는 PSD 파일을 선택하세요
            </span>
            <input
              type="file"
              accept="image/*,.psd"
              multiple
              onChange={handleFileChange}
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
            onClick={handleClose}
            disabled={isUploading}
          >
            취소
          </button>
          <button
            type="button"
            className="menu-bar__modal-primary"
            onClick={() => {
              void handleConfirm();
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
  const upload: Upload | undefined = editor.upload;
  const uiStore = editor.ui;
  const isFileModalOpen = uiStore.isFileModalOpen;
  const isUploadHistoryOpen = uiStore.isUploadHistoryOpen;
  const menuItems = ["File", "Edit", "Uploads"] as const;

  const handleFileMenuClick = () => {
    uiStore.openFileModal();
    uiStore.setUploadTitle(upload ? upload.pt_Title : "");
    uiStore.setSelectedFiles([]);
    uiStore.setIsUploading(false);
  };

  const handleUploadsMenuClick = () => {
    uiStore.openUploadHistory();
    uiStore.resetSelectedFiles();
    uiStore.setIsUploading(false);
  };  

  return (
    <>
      <nav className="menu-bar">
        <div className="menu-bar__group">
          {menuItems.map((item) => {
            const onClick =
              item === "File"
                ? handleFileMenuClick
                : item === "Uploads"
                ? handleUploadsMenuClick
                : undefined;

            return (
              <button
                key={item}
                type="button"
                className="menu-item"
                onClick={onClick}
              >
                {item}
              </button>
            );
          })}
        </div>
      </nav>
      {isFileModalOpen && <FileUploadModal editor={editor} />}
      {isUploadHistoryOpen && <UploadHistoryModal editor={editor} />}
    </>
  );
};

export default MenuBar;
