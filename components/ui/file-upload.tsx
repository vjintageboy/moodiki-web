"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Upload, FileIcon, Image as ImageIcon, Loader2, X } from "lucide-react"

interface FileUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  accept?: string
  maxSize?: number
  multiple?: boolean
  onUpload?: (files: File[]) => Promise<void>
  onFilesSelected?: (files: File[]) => void
  preview?: boolean
  disabled?: boolean
}

interface FilePreviewData {
  file: File
  preview?: string
  type: "image" | "document" | "other"
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({
    accept = "*",
    maxSize,
    multiple = false,
    onUpload,
    onFilesSelected,
    preview = true,
    disabled = false,
    className,
    ...props
  }, ref) => {
    const [isDragActive, setIsDragActive] = React.useState(false)
    const [files, setFiles] = React.useState<FilePreviewData[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const getFileType = (file: File): "image" | "document" | "other" => {
      if (file.type.startsWith("image/")) return "image"
      if (
        file.type === "application/pdf" ||
        file.type.includes("word") ||
        file.type.includes("sheet") ||
        file.type.includes("document")
      ) {
        return "document"
      }
      return "other"
    }

    const generateImagePreview = async (file: File): Promise<string | undefined> => {
      if (file.type.startsWith("image/")) {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            resolve(reader.result as string)
          }
          reader.readAsDataURL(file)
        })
      }
      return undefined
    }

    const validateFiles = (filesToValidate: File[]): { valid: File[]; errors: string[] } => {
      const errors: string[] = []
      const valid: File[] = []

      filesToValidate.forEach((file) => {
        // Check file type
        if (accept !== "*") {
          const acceptTypes = accept.split(",").map((type) => type.trim())
          const isAccepted = acceptTypes.some((type) => {
            if (type.endsWith("/*")) {
              return file.type.startsWith(type.split("/")[0])
            }
            return file.type === type || file.name.endsWith(type)
          })

          if (!isAccepted) {
            errors.push(`${file.name} has an unsupported file type`)
            return
          }
        }

        // Check file size
        if (maxSize && file.size > maxSize) {
          const maxMB = (maxSize / (1024 * 1024)).toFixed(2)
          errors.push(`${file.name} exceeds maximum size of ${maxMB}MB`)
          return
        }

        valid.push(file)
      })

      return { valid, errors }
    }

    const processFiles = async (filesToProcess: File[]) => {
      const { valid, errors } = validateFiles(filesToProcess)

      if (errors.length > 0) {
        console.error("File validation errors:", errors)
        return
      }

      if (!multiple && valid.length > 0) {
        valid.splice(1)
      }

      // Generate previews
      const processed: FilePreviewData[] = []
      for (const file of valid) {
        const type = getFileType(file)
        const preview_url = preview ? await generateImagePreview(file) : undefined
        processed.push({
          file,
          preview: preview_url,
          type,
        })
      }

      if (multiple) {
        setFiles((prev) => [...prev, ...processed])
      } else {
        setFiles(processed)
      }

      // Call callbacks
      const allFiles = multiple
        ? [...files.map((f) => f.file), ...valid]
        : valid
      onFilesSelected?.(allFiles)

      // Upload if handler provided
      if (onUpload && valid.length > 0) {
        setIsLoading(true)
        try {
          await onUpload(valid)
        } catch (error) {
          console.error("Upload failed:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        setIsDragActive(e.type === "dragenter" || e.type === "dragover")
      }
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      handleDrag(e)
      if (!disabled && e.dataTransfer.files) {
        processFiles(Array.from(e.dataTransfer.files))
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        processFiles(Array.from(e.target.files))
      }
    }

    const removeFile = (index: number) => {
      setFiles((prev) => {
        const updated = prev.filter((_, i) => i !== index)
        onFilesSelected?.(updated.map((f) => f.file))
        return updated
      })
    }

    const clearAll = () => {
      setFiles([])
      if (inputRef.current) {
        inputRef.current.value = ""
      }
      onFilesSelected?.([])
    }

    return (
      <div ref={ref} className={className} {...props}>
        {/* Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "relative rounded-lg border-2 border-dashed transition-colors",
            isDragActive && !disabled
              ? "border-primary bg-primary/5"
              : "border-input bg-transparent",
            disabled && "pointer-events-none opacity-50"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            disabled={disabled || isLoading}
            onChange={handleChange}
            className="sr-only"
            aria-label="File upload input"
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || isLoading}
            className="w-full p-6 flex flex-col items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="size-8 text-muted-foreground animate-spin" />
            ) : (
              <>
                <Upload className="size-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Drag files here or click to select
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {accept !== "*" && `Accepted formats: ${accept}`}
                    {maxSize && ` • Max size: ${(maxSize / (1024 * 1024)).toFixed(0)}MB`}
                  </p>
                </div>
              </>
            )}
          </button>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{files.length} file(s) selected</h3>
              {!isLoading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  disabled={disabled || isLoading}
                >
                  Clear all
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {files.map((item, index) => (
                <FileItem
                  key={`${item.file.name}-${index}`}
                  file={item.file}
                  preview={item.preview}
                  type={item.type}
                  onRemove={() => removeFile(index)}
                  disabled={isLoading || disabled}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
)

FileUpload.displayName = "FileUpload"

interface FileItemProps {
  file: File
  preview?: string
  type: "image" | "document" | "other"
  onRemove: () => void
  disabled?: boolean
}

function FileItem({ file, preview, type, onRemove, disabled }: FileItemProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-input bg-muted/50 p-3">
      {/* Thumbnail */}
      <div className="shrink-0">
        {preview && type === "image" ? (
          <img
            src={preview}
            alt={file.name}
            className="size-10 rounded-md object-cover"
          />
        ) : type === "document" ? (
          <div className="size-10 rounded-md bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <FileIcon className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
        ) : (
          <div className="size-10 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <FileIcon className="size-5 text-gray-600 dark:text-gray-400" />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </p>
      </div>

      {/* Remove Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${file.name}`}
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}

export { FileUpload }
