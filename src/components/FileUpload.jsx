import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

/**
 * A comprehensive file upload component with drag-and-drop, validation,
 * preview, and an option to select from existing health records.
 *
 * This component is now "controlled" by its parent via the `initialFile` prop
 * to ensure its state is always in sync, fixing the "select twice" bug.
 *
 * @param {function} onFileSelect - Callback function when a file is selected or removed.
 * @param {File|object|null} initialFile - The currently selected file from the parent component's state.
 * @param {string} className - Optional additional class names.
 * @param {boolean} isAvatar - Style variant for avatar uploads.
 * @param {Array} healthRecords - Array of existing health records for selection.
 */
const FileUpload = ({
  onFileSelect,
  initialFile,
  className,
  isAvatar = false,
  healthRecords = [],
}) => {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialFile && initialFile instanceof File) {
      setFileName(initialFile.name);
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(initialFile);
      setError("");
    } else if (initialFile && initialFile.dataUrl) {
      setFileName(initialFile.name);
      setPreview(initialFile.dataUrl);
    } else {
      setPreview(null);
      setFileName("");
      setError("");
    }
  }, [initialFile]);

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        setError("");

        const maxSize = 5 * 1024 * 1024;
        const allowedTypes = [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/jpg",
        ];

        if (!allowedTypes.includes(file.type)) {
          setError("Please upload PDF, JPEG, or PNG files only.");
          onFileSelect(null);
          return;
        }

        if (file.size > maxSize) {
          setError("File size must be under 5MB.");
          onFileSelect(null);
          return;
        }

        if (onFileSelect) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".png"], "application/pdf": [".pdf"] },
    multiple: false,
  });

  const handleRemove = (e) => {
    e.stopPropagation();
    if (onFileSelect) {
      onFileSelect(null);
    }
  };

  const handleBrowseClick = (e) => {
    e.stopPropagation();
    // Create a temporary file input to handle the browse functionality
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.multiple = false;

    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        // Use the same validation logic as onDrop
        setError("");

        const maxSize = 5 * 1024 * 1024;
        const allowedTypes = [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/jpg",
        ];

        if (!allowedTypes.includes(file.type)) {
          setError("Please upload PDF, JPEG, or PNG files only.");
          onFileSelect(null);
          return;
        }

        if (file.size > maxSize) {
          setError("File size must be under 5MB.");
          onFileSelect(null);
          return;
        }

        if (onFileSelect) {
          onFileSelect(file);
        }
      }
    };

    input.click();
  };

  const handleRecordSelect = (record) => {
    if (onFileSelect) {
      onFileSelect(record);
    }
    setDialogOpen(false);
  };

  if (preview) {
    if (isAvatar) {
      return (
        <div className="relative w-24 h-24">
          <button
            onClick={handleRemove}
            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 z-10 hover:bg-red-600 transition-colors"
            aria-label="Remove file"
          >
            <X size={14} />
          </button>
        </div>
      );
    }
    return (
      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          {preview.startsWith("data:image") ? (
            <img
              src={preview}
              alt="Preview"
              className="h-12 w-12 rounded-md object-cover flex-shrink-0"
            />
          ) : (
            <FileText className="h-10 w-10 text-primary flex-shrink-0" />
          )}
          <p className="font-medium text-sm truncate" title={fileName}>
            {fileName || "Uploaded File"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemove}
          className="text-red-500 hover:text-red-600 flex-shrink-0"
          aria-label="Remove file"
        >
          <X size={18} />
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <div
        {...getRootProps()}
        className={cn(
          "w-full p-6 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 transition-all text-gray-500 cursor-pointer",
          isDragActive && "border-primary bg-primary/10",
          error && "border-red-300 bg-red-50",
          className
        )}
      >
        <input {...getInputProps()} id="file-upload-input" />
        <div className="flex flex-col items-center justify-center">
          <UploadCloud className="w-10 h-10 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">
            {isDragActive ? "Drop the file here..." : "Drag & drop file here"}
          </p>
          <p className="text-sm">or</p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            <Button
              type="button"
              onClick={handleBrowseClick}
            >
              Browse Device
            </Button>
            {healthRecords && healthRecords.length > 0 && (
              <DialogTrigger asChild>
                <Button type="button" variant="outline">
                  From My Records
                </Button>
              </DialogTrigger>
            )}
          </div>
          <p className="text-xs mt-2">Images & PDF supported, up to 5MB</p>
          {error && (
            <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-md w-full">
              <p className="text-sm text-red-700 flex items-center justify-center gap-1.5">
                <X size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </p>
            </div>
          )}
        </div>
      </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select from Health Records</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto p-1">
          {healthRecords.length > 0 ? (
            <ul className="space-y-2">
              {healthRecords.map((record, i) => (
                <li
                  key={i}
                  onClick={() => handleRecordSelect(record)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                  <div className="flex-grow overflow-hidden">
                    <p className="font-semibold truncate">{record.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(record.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-8">No records found.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileUpload;
