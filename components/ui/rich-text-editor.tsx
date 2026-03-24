"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Heading2,
  Link as LinkIcon,
} from "lucide-react"

interface RichTextEditorProps
  extends Omit<React.ComponentPropsWithoutRef<"textarea">, "onChange"> {
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  showPreview?: boolean
}

const RichTextEditor = React.forwardRef<HTMLTextAreaElement, RichTextEditorProps>(
  ({
    value = "",
    onChange,
    disabled = false,
    showPreview = true,
    className,
    ...props
  }, ref) => {
    const [content, setContent] = React.useState(value)
    const [showPreviewMode, setShowPreviewMode] = React.useState(false)
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      setContent(newValue)
      onChange?.(newValue)
    }

    const insertMarkdown = (before: string, after: string = "") => {
      const textarea = textareaRef.current || ref
      if (!textarea || !(textarea instanceof HTMLTextAreaElement)) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value
      const selectedText = text.substring(start, end)

      const newText =
        text.substring(0, start) +
        before +
        selectedText +
        after +
        text.substring(end)

      setContent(newText)
      onChange?.(newText)

      // Restore cursor position
      setTimeout(() => {
        if (textarea instanceof HTMLTextAreaElement) {
          textarea.selectionStart = start + before.length
          textarea.selectionEnd = start + before.length + selectedText.length
          textarea.focus()
        }
      }, 0)
    }

    const handleBold = () => insertMarkdown("**", "**")
    const handleItalic = () => insertMarkdown("_", "_")
    const handleHeading = () => insertMarkdown("## ", "")
    const handleBulletList = () => insertMarkdown("- ", "")
    const handleNumberedList = () => insertMarkdown("1. ", "")
    const handleCode = () => insertMarkdown("`", "`")
    const handleLink = () => insertMarkdown("[", "](url)")

    const parseMarkdown = (markdown: string): string => {
      let html = markdown
        // Escape HTML
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        // Bold
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        // Italic
        .replace(/_(.+?)_/g, "<em>$1</em>")
        // Inline code
        .replace(/`(.+?)`/g, "<code>$1</code>")
        // Headings
        .replace(/^### (.*?)$/gm, "<h3>$1</h3>")
        .replace(/^## (.*?)$/gm, "<h2>$1</h2>")
        .replace(/^# (.*?)$/gm, "<h1>$1</h1>")
        // Line breaks
        .replace(/\n\n/g, "</p><p>")
        .replace(/\n/g, "<br>")

      return `<p>${html}</p>`
    }

    return (
      <div className={cn("space-y-2 w-full", className)}>
        {/* Toolbar */}
        <div className="flex flex-wrap gap-1 p-2 border border-input rounded-t-lg bg-muted/50 dark:bg-input/30">
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleBold}
              disabled={disabled || showPreviewMode}
              title="Bold (Ctrl+B)"
              className="hover:bg-accent"
            >
              <Bold className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleItalic}
              disabled={disabled || showPreviewMode}
              title="Italic (Ctrl+I)"
              className="hover:bg-accent"
            >
              <Italic className="size-4" />
            </Button>
          </div>

          <div className="w-px bg-border" />

          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleHeading}
              disabled={disabled || showPreviewMode}
              title="Heading"
              className="hover:bg-accent"
            >
              <Heading2 className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleBulletList}
              disabled={disabled || showPreviewMode}
              title="Bullet List"
              className="hover:bg-accent"
            >
              <List className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleNumberedList}
              disabled={disabled || showPreviewMode}
              title="Numbered List"
              className="hover:bg-accent"
            >
              <ListOrdered className="size-4" />
            </Button>
          </div>

          <div className="w-px bg-border" />

          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleCode}
              disabled={disabled || showPreviewMode}
              title="Code"
              className="hover:bg-accent"
            >
              <Code className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleLink}
              disabled={disabled || showPreviewMode}
              title="Link"
              className="hover:bg-accent"
            >
              <LinkIcon className="size-4" />
            </Button>
          </div>

          <div className="ml-auto flex gap-1">
            {showPreview && (
              <div className="flex gap-1 border-l border-border pl-1">
                <Button
                  type="button"
                  variant={showPreviewMode ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => setShowPreviewMode(false)}
                  disabled={disabled}
                  className="text-xs"
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant={showPreviewMode ? "ghost" : "outline"}
                  size="sm"
                  onClick={() => setShowPreviewMode(true)}
                  disabled={disabled}
                  className="text-xs"
                >
                  Preview
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        {showPreviewMode ? (
          <div
            className="min-h-32 w-full rounded-b-lg border border-t-0 border-input bg-transparent p-3 text-sm prose dark:prose-invert prose-sm max-w-none [&>p]:my-2 [&>h1]:my-2 [&>h2]:my-2 [&>h3]:my-2 [&>h1]:text-lg [&>h2]:text-base [&>h3]:text-sm [&>strong]:font-semibold [&>em]:italic [&>code]:bg-muted [&>code]:px-1 [&>code]:rounded"
            dangerouslySetInnerHTML={{
              __html: parseMarkdown(content),
            }}
          />
        ) : (
          <Textarea
            ref={textareaRef || ref}
            value={content}
            onChange={handleChange}
            disabled={disabled}
            placeholder="Enter text... Use Markdown for formatting"
            className={cn(
              "min-h-32 rounded-b-lg rounded-t-none border-t-0",
              className
            )}
            {...props}
          />
        )}

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Markdown support:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li><code className="bg-muted px-1 rounded">**bold**</code> for bold text</li>
            <li><code className="bg-muted px-1 rounded">_italic_</code> for italic text</li>
            <li><code className="bg-muted px-1 rounded"># Heading</code> for headings (use #, ##, or ###)</li>
            <li><code className="bg-muted px-1 rounded">- item</code> for bullet lists</li>
            <li><code className="bg-muted px-1 rounded">1. item</code> for numbered lists</li>
            <li><code className="bg-muted px-1 rounded">`code`</code> for inline code</li>
            <li><code className="bg-muted px-1 rounded">[link](url)</code> for links</li>
          </ul>
        </div>
      </div>
    )
  }
)

RichTextEditor.displayName = "RichTextEditor"

export { RichTextEditor }
