"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  Download,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Button from "../button/Button";

export interface BulkColumnDef {
  key: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "email" | "select";
  options?: string[];
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  templateFilename: string;
  columns: BulkColumnDef[];
  sampleData: Record<string, string>[];
  onConfirm: (rows: Record<string, string>[]) => Promise<{
    status?: boolean;
    success?: boolean;
    message?: string | null;
  }>;
  onSuccess?: () => void;
}

export default function BulkImportModal({
  isOpen,
  onClose,
  title,
  description,
  templateFilename,
  columns,
  sampleData,
  onConfirm,
  onSuccess,
}: BulkImportModalProps) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // ── 1. Download Excel Template ──────────────────────────────
  const handleDownloadTemplate = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, templateFilename);
      toast.success("Template Excel berhasil diunduh.");
    } catch (err) {
      toast.error("Gagal mengunduh template Excel.");
      console.error(err);
    }
  };

  // ── 2. Parse Uploaded Excel/CSV ─────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          raw: false,
          defval: "",
        });

        if (rawJson.length === 0) {
          toast.error("File Excel kosong atau tidak memiliki data.");
          return;
        }

        // Map column labels / keys leniently (case-insensitive & whitespace trimmed)
        const mappedRows = rawJson.map((rawRow) => {
          const rowObj: Record<string, string> = {};

          columns.forEach((col) => {
            // Find key match in rawRow by key or label
            const matchedKey = Object.keys(rawRow).find(
              (k) =>
                k.trim().toLowerCase() === col.key.toLowerCase() ||
                k.trim().toLowerCase() === col.label.toLowerCase() ||
                k.trim().toLowerCase().replace(/[^a-z0-9]/g, "") ===
                  col.key.toLowerCase().replace(/[^a-z0-9]/g, "")
            );

            rowObj[col.key] = matchedKey ? String(rawRow[matchedKey]).trim() : "";
          });

          return rowObj;
        });

        setRows(mappedRows);
        toast.success(`Berhasil memuat ${mappedRows.length} baris dari file Excel.`);
      } catch (err) {
        toast.error("Gagal membaca file Excel. Pastikan format file benar.");
        console.error(err);
      }
    };

    reader.readAsBinaryString(file);
    // Reset file input so same file can be re-uploaded if needed
    e.target.value = "";
  };

  // ── 3. Row Editing & Elimination ───────────────────────────
  const handleCellChange = (rowIndex: number, key: string, value: string) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], [key]: value };
      return updated;
    });
  };

  const handleRemoveRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddEmptyRow = () => {
    const emptyRow: Record<string, string> = {};
    columns.forEach((col) => {
      emptyRow[col.key] = "";
    });
    setRows((prev) => [...prev, emptyRow]);
  };

  const handleReset = () => {
    setRows([]);
    setFileName(null);
  };

  // ── 4. Validation Checks ───────────────────────────────────
  const validateRow = (row: Record<string, string>) => {
    for (const col of columns) {
      if (col.required && (!row[col.key] || row[col.key].trim() === "")) {
        return { valid: false, message: `${col.label} wajib diisi` };
      }
      if (
        col.type === "email" &&
        row[col.key] &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row[col.key].trim())
      ) {
        return { valid: false, message: "Format email tidak valid" };
      }
    }
    return { valid: true };
  };

  const invalidCount = rows.filter((r) => !validateRow(r).valid).length;

  // ── 5. Submit Action ───────────────────────────────────────
  const handleConfirmSubmit = async () => {
    if (rows.length === 0) {
      toast.error("Tidak ada data untuk diimpor.");
      return;
    }

    if (invalidCount > 0) {
      toast.error(`Harap perbaiki atau hapus ${invalidCount} baris yang memiliki kesalahan.`);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await onConfirm(rows);
      if (res.status !== false && res.success !== false) {
        toast.success(res.message || "Data berhasil diimpor!");
        handleReset();
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.message || "Gagal mengimpor data.");
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memproses data.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-secondary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-public-sans font-bold text-gray-900 dark:text-gray-100 text-lg">
                {title}
              </h3>
              {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {rows.length === 0 ? (
            /* Upload State */
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-12 px-6 text-center hover:border-secondary/50 transition-colors bg-gray-50/50 dark:bg-gray-800/30">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-secondary">
                <Upload className="h-7 w-7" />
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-base mb-1">
                Pilih atau Tarik File Excel / CSV
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                Mendukung format file <strong>.xlsx</strong>, <strong>.xls</strong>, dan <strong>.csv</strong>. Anda dapat melihat dan mengedit data sebelum disimpan.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 text-xs"
                >
                  <Upload className="h-4 w-4" />
                  Pilih File Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="gap-2 text-xs"
                >
                  <Download className="h-4 w-4" />
                  Unduh Template Excel
                </Button>
              </div>
            </div>
          ) : (
            /* Review & Edit State */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800/50 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <FileSpreadsheet className="h-4 w-4 text-secondary" />
                  <span>
                    File: <strong>{fileName || "Data Impor"}</strong> ({rows.length} baris)
                  </span>
                  {invalidCount > 0 ? (
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium ml-2">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {invalidCount} baris perlu perbaikan
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium ml-2">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Semua data valid
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddEmptyRow}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5 text-secondary" />
                    Tambah Baris
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Ganti File
                  </button>
                </div>
              </div>

              {/* Editable Table */}
              <div className="max-h-[48vh] overflow-x-auto overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="w-12 px-3 py-2.5 text-center">No</th>
                      {columns.map((col) => (
                        <th key={col.key} className="px-3 py-2.5 min-w-[140px]">
                          {col.label}
                          {col.required && <span className="text-red-500 ml-0.5">*</span>}
                        </th>
                      ))}
                      <th className="w-14 px-3 py-2.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {rows.map((row, idx) => {
                      const valResult = validateRow(row);
                      const isRowInvalid = !valResult.valid;

                      return (
                        <tr
                          key={idx}
                          className={
                            isRowInvalid
                              ? "bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50/70"
                              : "hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                          }
                        >
                          <td className="px-3 py-2 text-center text-gray-400 font-mono">
                            {idx + 1}
                          </td>
                          {columns.map((col) => {
                            const val = row[col.key] || "";
                            const isCellInvalid =
                              (col.required && !val) ||
                              (col.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val));

                            return (
                              <td key={col.key} className="p-1.5">
                                {col.type === "select" && col.options ? (
                                  <select
                                    value={val}
                                    onChange={(e) =>
                                      handleCellChange(idx, col.key, e.target.value)
                                    }
                                    className={`w-full rounded-lg px-2 py-1 text-xs bg-white dark:bg-gray-800 border ${
                                      isCellInvalid
                                        ? "border-red-400 text-red-700 dark:text-red-400"
                                        : "border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                                    } focus:outline-none focus:ring-1 focus:ring-secondary`}
                                  >
                                    {col.options.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    value={val}
                                    placeholder={col.placeholder || col.label}
                                    onChange={(e) =>
                                      handleCellChange(idx, col.key, e.target.value)
                                    }
                                    className={`w-full rounded-lg px-2.5 py-1 text-xs bg-white dark:bg-gray-800 border ${
                                      isCellInvalid
                                        ? "border-red-400 text-red-700 dark:text-red-400 bg-red-50/30"
                                        : "border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                                    } focus:outline-none focus:ring-1 focus:ring-secondary`}
                                  />
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              title="Hapus baris ini"
                              className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 px-6 py-4">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {rows.length > 0 && (
              <span>
                Total <strong>{rows.length} data</strong> akan diproses (password default:{" "}
                <code className="font-mono text-secondary">pass1234</code>)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isProcessing}
              className="text-xs"
            >
              Batal
            </Button>
            {rows.length > 0 && (
              <Button
                variant="primary"
                onClick={handleConfirmSubmit}
                disabled={isProcessing || rows.length === 0}
                className="gap-2 text-xs"
              >
                {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                Konfirmasi & Import ({rows.length})
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
