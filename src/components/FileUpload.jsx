import { useCallback, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  UploadCloud,
  File,
  X,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils.js"

const MAX_SIZE_MB = 5
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "image/jpg",
]

export default function FileUpload({
  onChange,
  accept = ACCEPTED_TYPES.join(","),
  maxSize = MAX_SIZE_MB * 1024 * 1024,
  multiple = false,
  value,
  label = "Déposer vos fichiers ici",
  hint,
  className,
  id = "file-upload",
}) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState(value || [])

  const validateFile = useCallback(
    (file) => {
      if (file.size > maxSize) {
        toast.error(`Fichier trop volumineux`, {
          description: `${file.name} dépasse ${maxSize / (1024 * 1024)}MB`,
        })
        return false
      }
      if (accept && accept !== "*") {
        const accepted = accept.split(",").map((t) => t.trim())
        const isAccepted = accepted.some((type) => {
          if (type.endsWith("/*")) {
            return file.type.startsWith(type.replace("/*", "/"))
          }
          return file.type === type || file.name.endsWith(type.replace(".", ""))
        })
        if (!isAccepted) {
          toast.error(`Type de fichier non accepté`, {
            description: `${file.name} n&apos;est pas autorisé`,
          })
          return false
        }
      }
      return true
    },
    [accept, maxSize]
  )

  const handleFiles = useCallback(
    (fileList) => {
      const newFiles = Array.from(fileList)
      const validFiles = newFiles.filter(validateFile)

      if (validFiles.length === 0) return

      const withPreview = validFiles.map((file) => ({
        file,
        id: `${file.name}-${file.size}-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
      }))

      const next = multiple ? [...files, ...withPreview] : withPreview
      setFiles(next)
      onChange?.(multiple ? next.map((f) => f.file) : next[0]?.file)

      if (validFiles.length > 0) {
        toast.success(`${validFiles.length} fichier${validFiles.length > 1 ? "s" : ""} ajouté${validFiles.length > 1 ? "s" : ""}`)
      }
    },
    [files, multiple, onChange, validateFile]
  )

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const removeFile = useCallback(
    (id) => {
      const toRemove = files.find((f) => f.id === id)
      if (toRemove?.preview) {
        URL.revokeObjectURL(toRemove.preview)
      }
      const next = files.filter((f) => f.id !== id)
      setFiles(next)
      onChange?.(multiple ? next.map((f) => f.file) : null)
    },
    [files, multiple, onChange]
  )

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} o`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  }

  const getFileIcon = (type) => {
    if (type?.startsWith("image/")) return ImageIcon
    return FileText
  }

  return (
    <div className={cn("space-y-3", className)}>
      <motion.div
        whileHover={!isDragging ? { scale: 1.005 } : {}}
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          "relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 overflow-hidden select-none",
          "flex flex-col items-center justify-center p-6 sm:p-8 text-center",
          isDragging
            ? "border-gold bg-gold/10 scale-[1.01]"
            : "border-border bg-card hover:border-gold/50 hover:bg-accent/30"
        )}
      >
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gold/5 pointer-events-none"
            />
          )}
        </AnimatePresence>

        <div className={cn(
          "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-3 transition-colors",
          isDragging ? "bg-gold/20" : "bg-gold/10"
        )}>
          <UploadCloud
            className={cn(
              "h-7 w-7 sm:h-8 sm:w-8 transition-colors duration-200",
              isDragging ? "text-gold scale-110" : "text-gold/80"
            )}
          />
        </div>

        <p className={cn(
          "text-sm sm:text-base font-medium mb-1 transition-colors",
          isDragging ? "text-gold" : "text-foreground"
        )}>
          {label}
        </p>
        <p className="text-xs text-muted-foreground">
          {hint || `ou cliquez pour sélectionner • ${maxSize / (1024 * 1024)}MB max`}
        </p>

        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
      </motion.div>

      <AnimatePresence initial={false}>
        {files.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((f) => {
              const IconComp = getFileIcon(f.type)
              return (
                <motion.li
                  key={f.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
                >
                  {f.preview ? (
                    <img
                      src={f.preview}
                      alt={f.name}
                      className="w-12 h-12 rounded-lg object-cover shrink-0 border border-border"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                      <IconComp className="h-6 w-6 text-gold" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{formatSize(f.size)}</span>
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(f.id)
                    }}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors shrink-0"
                    aria-label={`Supprimer ${f.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
