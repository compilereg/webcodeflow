import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import { useContestClock } from "features/contest-realtime";
import { submitRun, collectKnownRunNumbers, resolveSubmissionIdAfterSubmit } from "shared/api/runsApi";
import { fileToBase64, formatFileSize } from "shared/lib/fileToBase64";
import { isContestRunning } from "shared/lib/contestStatus";
import {
  formatAllowedExtensions,
  getAllowedExtensionsForLanguage,
  getFileLanguageMismatchMessage,
} from "shared/lib/languageFileExtensions";
import { useContestCatalog } from "./useContestCatalog";

export function QuickSubmitForm() {
  const { timeLeft, isRunning } = useContestClock();
  const { problems, languages, loadError: catalogError } = useContestCatalog();

  const [selectedProblem, setSelectedProblem] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalInputRef = useRef<HTMLInputElement>(null);

  const [modalMessage, setModalMessage] = useState("");
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error">("success");

  const isContestActive = isContestRunning({ isRunning, timeLeft });
  const canUpload = Boolean(
    isContestActive && selectedProblem && selectedLanguage
  );

  useEffect(() => {
    if (!isContestActive) {
      setSelectedProblem("");
      setSelectedLanguage("");
      setFile(null);
      setFileError("");
      setAdditionalFiles([]);
    }
  }, [isContestActive]);

  const clearMainFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const trySetMainFile = (nextFile: File | null) => {
    if (!nextFile) {
      setFile(null);
      setFileError("");
      clearMainFileInput();
      return;
    }

    if (!selectedLanguage) {
      setFile(nextFile);
      setFileError("");
      return;
    }

    const mismatch = getFileLanguageMismatchMessage(
      nextFile.name,
      selectedLanguage
    );
    if (mismatch) {
      setFile(null);
      setFileError(mismatch);
      clearMainFileInput();
      return;
    }

    setFile(nextFile);
    setFileError("");
  };

  const handleLanguageChange = (nextLanguage: string) => {
    setSelectedLanguage(nextLanguage);

    if (!file || !nextLanguage) {
      setFileError("");
      return;
    }

    const mismatch = getFileLanguageMismatchMessage(file.name, nextLanguage);
    if (mismatch) {
      setFile(null);
      setFileError(mismatch);
      clearMainFileInput();
      return;
    }

    setFileError("");
  };

  const addAdditionalFiles = (files: FileList | File[]) => {
    if (!canUpload) return;
    const newFiles = Array.from(files);
    setAdditionalFiles((prev) => [...prev, ...newFiles]);
    if (additionalInputRef.current) {
      additionalInputRef.current.value = "";
    }
  };

  const removeAdditionalFile = (index: number) => {
    if (!canUpload) return;
    setAdditionalFiles((prev) => prev.filter((_, i) => i !== index));
    if (additionalInputRef.current) {
      additionalInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!canUpload || !file || submitting) return;

    const mismatch = getFileLanguageMismatchMessage(
      file.name,
      selectedLanguage
    );
    if (mismatch) {
      setFileError(mismatch);
      return;
    }

    setSubmitting(true);
    try {
      const mainBase64 = await fileToBase64(file);
      const additionalFilesBase64 = await Promise.all(
        additionalFiles.map(async (f) => ({
          fileName: f.name,
          fileContentBase64: await fileToBase64(f),
        }))
      );
      const knownRunNumbers = await collectKnownRunNumbers();
      const body = {
        problemName: selectedProblem,
        languageName: selectedLanguage,
        mainFile: { fileName: file.name, fileContentBase64: mainBase64 },
        additionalFiles: additionalFilesBase64,
      };
      const { status, data } = await submitRun(body);

      switch (status) {
        case 200: {
          let runId =
            data?.runNumber != null && Number(data.runNumber) > 0
              ? Number(data.runNumber)
              : null;
          if (runId == null) {
            runId = await resolveSubmissionIdAfterSubmit(
              selectedProblem,
              selectedLanguage,
              knownRunNumbers
            );
          }
          setModalMessage(data?.message || "Run submitted successfully");
          setSubmissionId(runId);
          setModalType("success");
          setShowModal(true);
          setFile(null);
          setFileError("");
          setAdditionalFiles([]);
          if (fileInputRef.current) fileInputRef.current.value = "";
          if (additionalInputRef.current) additionalInputRef.current.value = "";
          break;
        }
        case 400:
          setSubmissionId(null);
          setModalMessage(
            data?.message ||
              "Submission failed - Validation errors in problem, language, or submitted files"
          );
          setModalType("error");
          setShowModal(true);
          break;
        case 401:
          setSubmissionId(null);
          setModalMessage(
            data?.message ||
              "Submission failed - Unauthorized, invalid session, or invalid/missing CSRF token"
          );
          setModalType("error");
          setShowModal(true);
          break;
        case 500:
          setSubmissionId(null);
          setModalMessage(
            data?.message ||
              "Submission failed - Unexpected internal server error"
          );
          setModalType("error");
          setShowModal(true);
          break;
        case 503:
          setSubmissionId(null);
          setModalMessage(
            data?.message || "Submission failed - PC2 contest data unavailable"
          );
          setModalType("error");
          setShowModal(true);
          break;
        default:
          setSubmissionId(null);
          setModalMessage(data?.message || "Submission failed");
          setModalType("error");
          setShowModal(true);
      }
    } catch (err) {
      console.error(err);
      setSubmissionId(null);
      setModalMessage("Server error");
      setModalType("error");
      setShowModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    "w-full appearance-none rounded-xl border border-border bg-surface-muted py-3.5 pl-11 pr-10 text-sm font-medium text-foreground outline-none transition focus:border-brand focus:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <>
      {showModal && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setShowModal(false)}
          aria-hidden
        />
      )}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-raised p-6 text-center shadow-xl">
            <div
              className={`text-4xl ${
                modalType === "success" ? "text-success" : "text-danger"
              }`}
            >
              {modalType === "success" ? "✔" : "✖"}
            </div>
            <h4
              className={`mt-3 text-lg font-bold ${
                modalType === "success" ? "text-success" : "text-danger"
              }`}
            >
              {modalMessage}
            </h4>
            {modalType === "success" && submissionId != null && (
              <p className="mt-3 text-2xl font-extrabold tabular-nums text-success">
                Submission #{submissionId}
              </p>
            )}
            <button
              type="button"
              className={`mt-4 rounded-xl px-5 py-2 text-sm font-semibold text-white ${
                modalType === "success" ? "bg-success" : "bg-danger"
              }`}
              onClick={() => setShowModal(false)}
            >
              Ok
            </button>
          </div>
        </div>
      )}

      <section
        data-tour="home-submit-form"
        className="rounded-[1.5rem] bg-surface-raised p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-8"
      >
        <div className="mb-6">
          <h2 className="text-[1.6rem] font-extrabold tracking-tight text-foreground">
            Quick Submit
          </h2>
          <p className="mt-1.5 text-sm text-foreground-muted">
            Select a problem and upload your source code file for evaluation.
          </p>
          {catalogError && (
            <p className="mt-3 rounded-xl border border-danger/30 bg-danger-muted px-3 py-2 text-sm text-danger">
              {catalogError}
            </p>
          )}
        </div>

        <div
          data-tour="home-dropdowns"
          className="mb-6 grid gap-4 sm:grid-cols-2"
        >
          <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted">
            Select Problem
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-subtle">
                <DocIcon />
              </span>
              <select
                className={fieldClass}
                disabled={!isContestActive}
                value={selectedProblem}
                onChange={(e) => {
                  setSelectedProblem(e.target.value);
                  setSelectedLanguage("");
                }}
              >
                <option value="">Choose a problem…</option>
                {problems.map((p, i) => (
                  <option key={i} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-subtle">
                <ChevronIcon />
              </span>
            </div>
          </label>

          <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted">
            Language
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-subtle">
                <CodeIcon />
              </span>
              <select
                className={fieldClass}
                disabled={!isContestActive || !selectedProblem}
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                <option value="">Choose a language…</option>
                {languages.map((l, i) => (
                  <option key={i} value={l.languageName}>
                    {l.languageName}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-subtle">
                <ChevronIcon />
              </span>
            </div>
          </label>
        </div>

        <div data-tour="home-uploads" className="mb-4">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted">
            Source Code
          </div>
          <DropZone
            disabled={!canUpload}
            hasFile={Boolean(file)}
            onClick={() => canUpload && fileInputRef.current?.click()}
            onDragOver={(e) => {
              if (!canUpload) return;
              e.preventDefault();
            }}
            onDrop={(e) => {
              if (!canUpload) return;
              e.preventDefault();
              if (e.dataTransfer.files.length > 0) {
                trySetMainFile(e.dataTransfer.files[0]);
              }
            }}
          >
            <CloudIcon />
            {file ? (
              <span className="max-w-full truncate px-2 font-semibold text-foreground">
                {file.name}
              </span>
            ) : (
              <>
                <span className="text-sm font-medium text-foreground">
                  Drag and drop file here or{" "}
                  <span className="font-semibold text-brand">browse files</span>
                </span>
                <span className="text-xs text-foreground-subtle">
                  {selectedLanguage
                    ? (() => {
                        const allowed =
                          getAllowedExtensionsForLanguage(selectedLanguage);
                        return allowed
                          ? `Expected for ${selectedLanguage}: ${formatAllowedExtensions(allowed)} (Max size: 256KB)`
                          : "Supported formats: .cpp, .c, .java, .py, .rs (Max size: 256KB)";
                      })()
                    : "Supported formats: .cpp, .c, .java, .py, .rs (Max size: 256KB)"}
                </span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              disabled={!canUpload}
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                if (!canUpload) return;
                if (e.target.files && e.target.files.length > 0) {
                  trySetMainFile(e.target.files[0]);
                }
              }}
            />
          </DropZone>
          {fileError && (
            <p className="mt-2 text-sm font-medium text-danger" role="alert">
              {fileError}
            </p>
          )}
        </div>

        <div className="mb-4">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted">
            Additional Files (Optional)
          </div>
          <DropZone
            disabled={!canUpload}
            hasFile={false}
            compact
            onClick={() => canUpload && additionalInputRef.current?.click()}
            onDragOver={(e) => {
              if (!canUpload) return;
              e.preventDefault();
            }}
            onDrop={(e) => {
              if (!canUpload) return;
              e.preventDefault();
              addAdditionalFiles(e.dataTransfer.files);
            }}
          >
            <FolderIcon />
            <span className="text-sm font-medium text-foreground">
              Add additional files
            </span>
            <span className="text-xs text-foreground-subtle">
              Drag & drop or click to add more files
            </span>
            <input
              ref={additionalInputRef}
              type="file"
              multiple
              disabled={!canUpload}
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                if (!canUpload) return;
                if (e.target.files) addAdditionalFiles(e.target.files);
              }}
            />
          </DropZone>
        </div>

        {additionalFiles.length > 0 && (
          <div className="mb-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted">
              Added Files
            </div>
            <div className="flex flex-wrap gap-2">
              {additionalFiles.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-2.5 py-1.5 text-sm"
                >
                  <FileIcon />
                  <span className="max-w-[10rem] truncate text-foreground">
                    {f.name}
                  </span>
                  <span className="text-xs text-foreground-subtle">
                    {formatFileSize(f.size)}
                  </span>
                  <button
                    type="button"
                    className="text-foreground-muted hover:text-danger"
                    onClick={() => removeAdditionalFile(i)}
                    title="Remove"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          data-tour="home-submit-btn"
          className="mt-7 flex flex-col items-end gap-2"
        >
          <button
            type="button"
            className="inline-flex items-center gap-2.5 rounded-full bg-brand px-8 py-3.5 text-sm font-extrabold uppercase tracking-[0.1em] text-white shadow-[0_12px_28px_rgba(59,130,246,0.35)] transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            disabled={!canUpload || !file || Boolean(fileError) || submitting}
            onClick={() => void handleSubmit()}
          >
            <SendIcon />
            {submitting ? "Submitting…" : "Submit Solution"}
          </button>
          <p className="text-xs text-foreground-subtle">
            Make sure your solution is correct before submitting.
          </p>
        </div>
      </section>
    </>
  );
}

function DropZone({
  children,
  disabled,
  hasFile,
  compact,
  onClick,
  onDragOver,
  onDrop,
}: {
  children: ReactNode;
  disabled: boolean;
  hasFile: boolean;
  compact?: boolean;
  onClick: () => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand/40 bg-dropzone text-center transition hover:border-brand hover:bg-brand-muted/40 ${
        compact ? "px-4 py-5 sm:py-7" : "px-4 py-10 sm:py-16"
      } ${hasFile ? "border-brand bg-brand-muted/50" : ""} ${
        disabled
          ? "cursor-not-allowed opacity-50 hover:border-brand/40 hover:bg-dropzone"
          : ""
      }`}
    >
      {children}
    </div>
  );
}

function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg
      className="mb-1 h-11 w-11 text-brand"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-brand"
      aria-hidden
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
