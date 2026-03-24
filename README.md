This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## 📋 Form Components

A comprehensive set of form components has been added to the admin panel, providing everything needed for creating modern, accessible, and user-friendly forms.

### Available Components

1. **Form Wrapper** - React Hook Form integration with FormField, FormItem, FormLabel, FormControl, and FormMessage
2. **File Upload** - Drag-and-drop file upload with validation, preview, and progress
3. **Date Picker** - Interactive calendar with date constraints and format options
4. **Time Picker** - Time selector with 12/24-hour format and interval options
5. **Multi-Select** - Dropdown with checkboxes, search, and selection management
6. **Rich Text Editor** - Markdown-based editor with formatting toolbar and preview

### Key Features

✅ Full TypeScript support  
✅ React Hook Form integration  
✅ Dark mode support  
✅ Accessibility (WCAG 2.1 AA)  
✅ Keyboard navigation  
✅ No additional dependencies  
✅ Comprehensive documentation  

### Quick Start

```typescript
import { DatePicker, FileUpload, MultiSelect } from "@/components/ui"
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui"

const form = useForm({ resolver: zodResolver(schema) })
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField control={form.control} name="date" render={({field}) => (
      <FormItem>
        <FormLabel>Date</FormLabel>
        <FormControl>
          <DatePicker value={field.value} onChange={field.onChange} />
        </FormControl>
      </FormItem>
    )} />
  </form>
</Form>
```

### Documentation

- **[FORM_COMPONENTS.md](./FORM_COMPONENTS.md)** - Complete API reference with examples
- **[FORM_COMPONENTS_INTEGRATION.md](./FORM_COMPONENTS_INTEGRATION.md)** - Quick integration guide
- **[FORM_COMPONENTS_QUICK_REFERENCE.md](./FORM_COMPONENTS_QUICK_REFERENCE.md)** - Developer cheat sheet
- **[FORM_COMPONENTS_SUMMARY.md](./FORM_COMPONENTS_SUMMARY.md)** - Project overview
- **[FORM_COMPONENTS_MANIFEST.md](./FORM_COMPONENTS_MANIFEST.md)** - File listing and status

### Example Implementation

See [components/form-components-example.tsx](./components/form-components-example.tsx) for a complete working example with validation, state management, and error handling.

