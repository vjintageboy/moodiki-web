/**
 * Example form component showcasing all new form components
 * This is a reference implementation for using the form components
 */

"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Input,
  Textarea,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui"
import { FileUpload } from "@/components/ui/file-upload"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { MultiSelect, type Option } from "@/components/ui/multi-select"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { useState } from "react"
import { toast } from "sonner"

// Validation schema
const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  appointmentDate: z.date().min(new Date(), "Date must be in the future"),
  appointmentTime: z.date().optional(),
  categories: z.array(z.string()).min(1, "Select at least one category"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  profileImage: z.instanceof(File).optional(),
})

type FormValues = z.infer<typeof formSchema>

// Category options
const CATEGORY_OPTIONS: Option[] = [
  { value: "mental-health", label: "Mental Health" },
  { value: "wellness", label: "Wellness & Lifestyle" },
  { value: "fitness", label: "Fitness & Exercise" },
  { value: "nutrition", label: "Nutrition & Diet" },
  { value: "meditation", label: "Meditation & Mindfulness" },
  { value: "sleep", label: "Sleep & Rest" },
]

/**
 * Complete form example showing all form components
 */
export function FormComponentsExample() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      categories: [],
      content: "",
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true)

      // Simulate API call
      console.log("Submitting form:", {
        ...values,
        files: selectedFiles,
      })

      // In a real app, you would send this to your server
      // const formData = new FormData()
      // Object.entries(values).forEach(([key, value]) => {
      //   if (value) formData.append(key, value)
      // })
      // selectedFiles.forEach(file => formData.append('files', file))
      // const response = await fetch('/api/submit', { method: 'POST', body: formData })

      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success("Form submitted successfully!")
      form.reset()
      setSelectedFiles([])
    } catch (error) {
      toast.error("Failed to submit form")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Form Components Demo</h1>
        <p className="text-muted-foreground mt-2">
          Complete example showcasing all available form components
        </p>
      </div>

      {/* Main Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Article</CardTitle>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title Input */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Article Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter article title"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      The title will be displayed prominently in the feed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description Textarea */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Brief description of the article"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      This appears as a preview in the article list
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Picker */}
              <FormField
                control={form.control}
                name="appointmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publication Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        minDate={new Date()}
                        placeholder="Select publication date"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      When should this article go live?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time Picker */}
              <FormField
                control={form.control}
                name="appointmentTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publication Time (Optional)</FormLabel>
                    <FormControl>
                      <TimePicker
                        value={field.value}
                        onChange={field.onChange}
                        format24h={false}
                        step={30}
                        placeholder="Select time"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      If not specified, defaults to 9:00 AM
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Multi-Select */}
              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categories</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={CATEGORY_OPTIONS}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select one or more categories"
                        searchPlaceholder="Search categories..."
                        maxSelections={3}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Categorize your article (max 3 categories)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Upload */}
              <FormItem>
                <FormLabel>Featured Image</FormLabel>
                <FormControl>
                  <FileUpload
                    accept="image/*"
                    maxSize={5 * 1024 * 1024} // 5MB
                    preview
                    disabled={isSubmitting}
                    onFilesSelected={(files) => {
                      setSelectedFiles(files)
                      if (files.length > 0) {
                        form.setValue(
                          "profileImage",
                          files[0],
                          { shouldValidate: true }
                        )
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Upload a featured image for your article (max 5MB)
                </FormDescription>
              </FormItem>

              {/* Rich Text Editor */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Article Content</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        showPreview
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Use Markdown formatting for better presentation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Info Box */}
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
                <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
                  ℹ️ Form State
                </h3>
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  Selected categories: {form.watch("categories").length > 0 ? form.watch("categories").join(", ") : "None"}
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  Date: {form.watch("appointmentDate")?.toDateString()}
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Submitting..." : "Submit Article"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Component Reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-1">Form Components Used:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Form with React Hook Form integration</li>
              <li>Input (standard text input)</li>
              <li>Textarea (multi-line text)</li>
              <li>DatePicker (calendar popup)</li>
              <li>TimePicker (time selector)</li>
              <li>MultiSelect (dropdown with checkboxes)</li>
              <li>FileUpload (drag & drop with preview)</li>
              <li>RichTextEditor (Markdown with toolbar)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Features Demonstrated:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Zod validation with error messages</li>
              <li>Disabled states during submission</li>
              <li>Form descriptions and help text</li>
              <li>Real-time form state display</li>
              <li>Success/error notifications</li>
              <li>Dark mode support</li>
              <li>Keyboard navigation</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples Card */}
      <Card>
        <CardHeader>
          <CardTitle>Common Patterns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">With React Hook Form</h4>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Label</FormLabel>
      <FormControl>
        <DatePicker
          value={field.value}
          onChange={field.onChange}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2">Without Form Integration</h4>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`const [value, setValue] = useState<Date | null>(null)

<DatePicker
  value={value}
  onChange={setValue}
  minDate={new Date()}
/>
`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FormComponentsExample
