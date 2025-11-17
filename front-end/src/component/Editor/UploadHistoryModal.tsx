import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import type { UploadBatchDto } from "@shared/types/uploads";
import { Editor } from "./Layout";

type UploadHistoryModalProps = {
  editor: Editor;
};

type HistoryTab = "user" | "test";

const historyTabs: { value: HistoryTab; label: string }[] = [
  { value: "user", label: "내 업로드" },
  { value: "test", label: "테스트 배치" },
];

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  const value = bytes / Math.pow(1024, exponent);
  const formatted =
    value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1);
  return `${formatted} ${units[exponent]}`;
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "completed":
      return "완료";
    case "processing":
      return "처리 중";
    case "failed":
      return "실패";
    case "test":
      return "테스트";
    default:
      return status;
  }
};

const UploadHistoryModal: React.FC<UploadHistoryModalProps> = ({ editor }) => {
  const [batches, setBatches] = useState<UploadBatchDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<HistoryTab>("test");
  const requestIdRef = useRef(0);
  const selectedBatch = editor.pt_selectedUploadBatch;

  const handleClose = useCallback(() => {
    editor.iv_isUploadHistoryOpen = false;
    editor.im_forceRender();
  }, [editor]);

  const loadHistory = useCallback(
    async (variant: HistoryTab) => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);

      try {
        const data = await editor.im_loadHistory(variant);

        if (requestId !== requestIdRef.current) {
          return;
        }

        if (data.success) {
          const nextBatches = Array.isArray(data.batches) ? data.batches : [];
          setBatches(nextBatches);
        } else {
          setBatches([]);
          const fallbackMessage =
            variant === "test"
              ? "테스트 배치를 불러오지 못했습니다."
              : "업로드 내역을 불러오지 못했습니다.";
          setError(data.message ?? fallbackMessage);
        }
      } catch (caughtError) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setBatches([]);

        if (axios.isAxiosError(caughtError)) {
          const fallbackMessage =
            variant === "test"
              ? "테스트 배치를 불러오지 못했습니다."
              : "업로드 내역을 불러오지 못했습니다.";
          const responseMessage = (
            caughtError.response?.data as { message?: string } | undefined
          )?.message;
          setError(responseMessage ?? fallbackMessage);
        } else {
          setError("업로드 내역을 불러오지 못했습니다.");
        }
      } finally {
        if (requestId !== requestIdRef.current) {
          return;
        }
        setIsLoading(false);
      }
    },
    [editor]
  );

  useEffect(() => {
    void loadHistory(activeTab);
    return () => {
      requestIdRef.current += 1;
    };
  }, [activeTab, loadHistory]);

  const handleRefresh = useCallback(() => {
    void loadHistory(activeTab);
  }, [activeTab, loadHistory]);

  const handleTabChange = useCallback(
    (nextTab: HistoryTab) => {
      if (nextTab === activeTab) {
        return;
      }
      setBatches([]);
      setError(null);
      setActiveTab(nextTab);
    },
    [activeTab]
  );

  const handleBatchSelect = useCallback(
    (batch: UploadBatchDto) => {
      handleClose();
      editor.im_setSelectedUploadBatch(batch);
    },
    [editor, handleClose]
  );

  const handleBatchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>, batch: UploadBatchDto) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleClose();
        editor.im_setSelectedUploadBatch(batch);
      }
    },
    [editor, handleClose]
  );

  const summaryText = isLoading
    ? activeTab === "test"
      ? "테스트 배치를 불러오는 중입니다..."
      : "업로드 내역을 불러오는 중입니다..."
    : activeTab === "test"
    ? `총 ${batches.length}개의 테스트 배치`
    : `총 ${batches.length}개의 업로드 배치`;

  return (
    <div
      className="menu-bar__modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-history-title"
    >
      <div className="menu-bar__modal menu-bar__modal--history">
        <header className="menu-bar__modal-header">
          <h2 id="upload-history-title">업로드 내역</h2>
          <button
            type="button"
            className="menu-bar__modal-close"
            onClick={handleClose}
            aria-label="업로드 내역 모달 닫기"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </header>
        <div className="menu-bar__modal-body menu-bar__history-body">
          <div className="menu-bar__history-toolbar">
            <div className="menu-bar__history-toolbar-left">
              <span className="menu-bar__history-summary">{summaryText}</span>
              <div className="menu-bar__history-tabs" role="tablist">
                {historyTabs.map((tab) => {
                  const isActive = activeTab === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`menu-bar__history-tab${
                        isActive ? " is-active" : ""
                      }`}
                      onClick={() => handleTabChange(tab.value)}
                    >
                      {tab.label}
                      {tab.value === "test" && (
                        <span className="menu-bar__history-chip menu-bar__history-chip--warning">
                          TEST
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              className="menu-bar__history-refresh"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <i className="bi bi-arrow-repeat" aria-hidden="true" />
              새로고침
            </button>
          </div>
          {error && (
            <div className="menu-bar__history-message menu-bar__history-message--error">
              {error}
            </div>
          )}
          {!error && !isLoading && batches.length === 0 && (
            <div className="menu-bar__history-message">
              {activeTab === "test"
                ? "제공 가능한 테스트 배치가 없습니다."
                : "아직 업로드한 파일이 없습니다."}
            </div>
          )}
          <div
            className="menu-bar__history-scroll"
            aria-busy={isLoading}
            aria-live="polite"
          >
            {batches.map((batch) => {
              const isSelected = selectedBatch?.id === batch.id;
              return (
                <section
                  key={`${batch.id}-${batch.uuid}`}
                  className={`menu-bar__history-batch${
                    isSelected ? " menu-bar__history-batch--selected" : ""
                  }`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => handleBatchSelect(batch)}
                  onKeyDown={(event) => handleBatchKeyDown(event, batch)}
                >
                  <header className="menu-bar__history-batch-header">
                    <div>
                      <h3 className="menu-bar__history-batch-title">
                        {batch.title ?? "제목 없음"}
                      </h3>
                      <p className="menu-bar__history-batch-subtitle">
                        {batch.uuid}
                      </p>
                    </div>
                    <div className="menu-bar__history-meta">
                      <span className="menu-bar__history-chip">
                        {getStatusLabel(batch.status)}
                      </span>
                      {batch.isTest && (
                        <span className="menu-bar__history-chip menu-bar__history-chip--warning">
                          TEST
                        </span>
                      )}
                      <span className="menu-bar__history-meta-text">
                        {batch.fileCount}개 파일
                      </span>
                      <span className="menu-bar__history-meta-text">
                        {formatBytes(batch.totalSize)}
                      </span>
                    </div>
                  </header>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadHistoryModal;
