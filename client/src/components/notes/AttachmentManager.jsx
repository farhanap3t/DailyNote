import React, { useRef, useState } from 'react';
import { Paperclip, FileText, Image as ImageIcon, File, Trash2, Download, Upload, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';

export default function AttachmentManager({ noteId, attachments = [], onAttachmentAdded, onAttachmentDeleted }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 10MB limit check
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Ukuran file melebihi batas maksimal 10 MB.');
      return;
    }

    setErrorMsg('');
    setUploading(true);

    try {
      if (noteId && !noteId.startsWith('local-')) {
        const res = await api.uploadAttachment(noteId, file);
        onAttachmentAdded(res.attachment);
      } else {
        // If note is not yet saved to backend, temporarily simulate
        const tempAtt = {
          id: 'temp-' + Date.now(),
          file_name: file.name,
          file_url: URL.createObjectURL(file),
          file_type: file.type,
          file_size: file.size,
          created_at: new Date().toISOString()
        };
        onAttachmentAdded(tempAtt);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengunggah lampiran.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (attId) => {
    if (!noteId || noteId.startsWith('local-')) {
      onAttachmentDeleted(attId);
      return;
    }

    try {
      await api.deleteAttachment(noteId, attId);
      onAttachmentDeleted(attId);
    } catch (err) {
      setErrorMsg('Gagal menghapus lampiran: ' + err.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType = '') => {
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType.includes('pdf')) return FileText;
    return File;
  };

  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-sky-500" />
          Lampiran ({attachments.length})
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 text-xs font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 p-1 rounded hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          {uploading ? 'Mengunggah...' : 'Unggah File'}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.json"
          className="hidden"
        />
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Attachment previews / list */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
          {attachments.map((att) => {
            const Icon = getFileIcon(att.file_type);
            const isImage = att.file_type?.startsWith('image/');
            return (
              <div
                key={att.id}
                className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:shadow-sm transition-all text-xs group"
              >
                {isImage ? (
                  <img
                    src={att.file_url}
                    alt={att.file_name}
                    className="w-10 h-10 rounded-lg object-cover border border-slate-100 dark:border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-slate-800 dark:text-slate-200" title={att.file_name}>
                    {att.file_name}
                  </p>
                  <p className="text-[10px] text-slate-400">{formatFileSize(att.file_size)}</p>
                </div>

                <div className="flex items-center gap-1">
                  <a
                    href={att.file_url}
                    target="_blank"
                    rel="noreferrer"
                    download={att.file_name}
                    className="p-1.5 text-slate-400 hover:text-sky-600 rounded"
                    title="Unduh / Lihat"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(att.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

