"use client";

import { useState, useRef, useCallback } from "react";

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function DropZone({ onFileSelect, disabled }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      const validTypes = ["image/png", "image/jpeg", "image/webp"];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a PNG, JPEG, or WebP image.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  return (
    <div
      className={`dropzone ${isDragOver ? "dropzone--active" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => handleFile(e.target.files?.[0])}
        style={{ display: "none" }}
        disabled={disabled}
      />

      {preview ? (
        <>
          <img src={preview} alt="Preview" className="dropzone__preview" />
          <p className="dropzone__change">click or drag to change</p>
        </>
      ) : (
        <>
          <span className="dropzone__icon">↑</span>
          <p className="dropzone__title">upload context</p>
          <p className="dropzone__subtitle">drop a screenshot or click to browse</p>
          <div className="dropzone__formats">
            <span className="dropzone__badge">PNG</span>
            <span className="dropzone__badge">JPEG</span>
            <span className="dropzone__badge">WebP</span>
          </div>
        </>
      )}
    </div>
  );
}
