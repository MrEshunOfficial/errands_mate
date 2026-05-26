"use client";

/**
 * Required: npm install mammoth
 */

import { useRef, useState } from "react";
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FilePlus2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useBulkImportCategories } from "@/hooks/services/categories/useServiceCategory";

const ACCEPTED = [".txt", ".docx"];
const ACCEPTED_MIME = [
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function validate(file: File) {
  if (!ACCEPTED_MIME.includes(file.type))
    return "Only .txt and .docx files are accepted.";
  if (file.size > 5 * 1024 * 1024) return "File must be under 5 MB.";
  return null;
}

async function parseFile(file: File): Promise<string[]> {
  if (file.type === "text/plain") {
    const text = await file.text();
    return text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  }
  const mammoth = (await import("mammoth")).default;
  const buffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer: buffer });
  return value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

// ─── Preview panel ────────────────────────────────────────────────────────────

function PreviewPanel({
  rows,
  filename,
}: {
  rows: string[];
  filename: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? rows.filter((r) => r.toLowerCase().includes(query.toLowerCase()))
    : rows;

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-background">
      {/* Panel header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-foreground truncate">
            {filename}
          </span>
          <Badge
            variant="secondary"
            className="text-[10px] font-semibold shrink-0">
            {rows.length} {rows.length === 1 ? "entry" : "entries"}
          </Badge>
        </div>

        {/* Search */}
        <div className="relative w-40 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter…"
            className="h-7 pl-7 text-xs rounded-md"
          />
        </div>
      </div>

      {/* Rows */}
      <div className="overflow-y-auto max-h-80 divide-y divide-border">
        {filtered.length > 0 ? (
          filtered.map((row, i) => {
            const originalIndex = rows.indexOf(row);
            return (
              <div
                key={i}
                className="group flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors">
                <span className="text-xs text-muted-foreground/60 w-6 shrink-0 text-right tabular-nums select-none">
                  {originalIndex + 1}
                </span>
                <span className="text-sm text-foreground leading-snug flex-1">
                  {query ? <Highlighted text={row} query={query} /> : row}
                </span>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-1.5">
            <Search className="h-4 w-4 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              No entries match &quot;{query}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {query && filtered.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {rows.length} entries
          </p>
        </div>
      )}
    </div>
  );
}

function Highlighted({ text, query }: { text: string; query: string }) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 dark:bg-yellow-900/50 text-foreground rounded-[2px] px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BulkCategoryImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[] | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );

  const { mutate, isLoading } = useBulkImportCategories({
    onSuccess: () =>
      setResult({ ok: true, message: "Categories imported successfully." }),
    onError: (err) =>
      setResult({ ok: false, message: err.message ?? "Something went wrong." }),
  });

  async function pick(f: File) {
    const err = validate(f);
    if (err) {
      setError(err);
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
    setPreview(null);
    setParsing(true);
    try {
      setPreview(await parseFile(f));
    } catch {
      setError("Could not read the file. Please check it and try again.");
    } finally {
      setParsing(false);
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setError(null);
    setResult(null);
  }

  const isSuccess = result?.ok === true;
  const isError = result?.ok === false;
  const canSubmit = !!file && !!preview?.length && !isLoading && !isSuccess;

  return (
    <div className="w-full max-w-6xl space-y-3">
      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold text-foreground">
          Bulk import categories
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Upload a{" "}
          <code className="bg-muted px-1 rounded font-mono text-[11px]">
            .txt
          </code>{" "}
          or{" "}
          <code className="bg-muted px-1 rounded font-mono text-[11px]">
            .docx
          </code>{" "}
          file · one category per line · max 5 MB
        </p>
      </div>

      {/* Drop zone — collapses to a slim bar once a file is loaded */}
      {!file ? (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload file"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) pick(f);
          }}
          className={cn(
            "flex flex-col items-center gap-2.5 py-9 px-6 w-full rounded-xl border border-dashed",
            "cursor-pointer outline-none transition-colors duration-150",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            dragging
              ? "border-primary/50 bg-primary/5"
              : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50",
          )}>
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full",
              dragging
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}>
            <Upload className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="text-center">
            <p
              className={cn(
                "text-sm font-medium",
                dragging ? "text-primary" : "text-foreground",
              )}>
              {dragging ? "Drop to upload" : "Click or drag a file here"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              .txt or .docx
            </p>
          </div>
        </div>
      ) : (
        // Slim file bar
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-colors",
            isSuccess
              ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30"
              : isError
                ? "border-destructive/30 bg-destructive/5"
                : "border-border bg-muted/30",
          )}>
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
              isSuccess
                ? "border-emerald-200 bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/40"
                : isError
                  ? "border-destructive/20 bg-destructive/10"
                  : "border-border bg-background",
            )}>
            {parsing || isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : isSuccess ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : isError ? (
              <AlertCircle className="h-3.5 w-3.5 text-destructive" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-xs font-medium text-foreground">
              {file.name}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              {parsing
                ? "Reading…"
                : isLoading
                  ? "Importing…"
                  : isSuccess
                    ? "Imported"
                    : preview
                      ? `${preview.length} entries`
                      : `${(file.size / 1024).toFixed(1)} KB`}
            </span>
          </div>
          {!isLoading && !isSuccess && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={reset}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pick(f);
          e.target.value = "";
        }}
      />

      {/* Preview */}
      {preview && !isSuccess && (
        <PreviewPanel rows={preview} filename={file!.name} />
      )}

      {preview?.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-1">
          No entries found. Make sure the file has one category per line.
        </p>
      )}

      {/* Feedback */}
      {(error || result) && (
        <Alert
          variant={isSuccess ? "default" : "destructive"}
          className={cn(
            "px-3 py-2",
            isSuccess &&
              "border-emerald-200 bg-emerald-50/50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 [&>svg]:text-emerald-500",
          )}>
          {isSuccess ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5" />
          )}
          <AlertDescription className="text-xs">
            {error ?? result?.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      {(file || isSuccess) && (
        <div className="flex justify-end gap-2">
          {isSuccess && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={reset}>
              <FilePlus2 className="h-3.5 w-3.5" />
              Import another
            </Button>
          )}
          {file && !isSuccess && !isLoading && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={reset}>
              Clear
            </Button>
          )}
          {canSubmit && (
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => mutate(file!)}>
              <Upload className="h-3.5 w-3.5" />
              Import {preview?.length}{" "}
              {preview?.length === 1 ? "category" : "categories"}
            </Button>
          )}
          {isLoading && (
            <Button size="sm" className="h-8 gap-1.5 text-xs" disabled>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Importing…
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
