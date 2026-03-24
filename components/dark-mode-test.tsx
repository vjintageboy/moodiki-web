import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Dark Mode Test Component
 * 
 * This component showcases how dark mode works across various UI elements
 * To test:
 * 1. Import and render this component in any page
 * 2. Click the theme toggle in the header
 * 3. Observe that all elements below respond to theme changes
 */
export function DarkModeTestComponent() {
  return (
    <div className="w-full max-w-2xl space-y-6 p-6">
      {/* Card with title and description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Dark Mode Test Card</CardTitle>
          <CardDescription>
            This card demonstrates dark mode support using semantic color variables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Toggle the theme using the Sun/Moon icon in the header to see how colors adapt.
          </p>

          {/* Color variables showcase */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded bg-background border border-border">
              <p className="font-semibold text-foreground">Background</p>
              <p className="text-muted-foreground text-xs">Primary background color</p>
            </div>

            <div className="p-4 rounded bg-card border border-border">
              <p className="font-semibold text-card-foreground">Card</p>
              <p className="text-muted-foreground text-xs">Card background color</p>
            </div>

            <div className="p-4 rounded bg-primary text-primary-foreground border border-border">
              <p className="font-semibold">Primary</p>
              <p className="text-xs opacity-90">Primary action color</p>
            </div>

            <div className="p-4 rounded bg-secondary text-secondary-foreground border border-border">
              <p className="font-semibold">Secondary</p>
              <p className="text-xs opacity-90">Secondary action color</p>
            </div>

            <div className="p-4 rounded bg-muted text-muted-foreground border border-border">
              <p className="font-semibold">Muted</p>
              <p className="text-xs opacity-90">Muted content color</p>
            </div>

            <div className="p-4 rounded bg-destructive text-destructive-foreground border border-border">
              <p className="font-semibold">Destructive</p>
              <p className="text-xs opacity-90">Danger action color</p>
            </div>
          </div>

          {/* Button variants */}
          <div className="mt-6 space-y-3">
            <p className="text-sm font-semibold text-foreground">Button Variants:</p>
            <div className="flex flex-wrap gap-2">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info box */}
      <div className="p-4 rounded border border-border bg-muted/50">
        <p className="text-sm text-foreground">
          <strong>💡 Tip:</strong> Try the following to test dark mode:
        </p>
        <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
          <li>Click the Sun/Moon toggle button in the header</li>
          <li>Refresh the page - your preference is saved</li>
          <li>Check browser storage (DevTools → Application → Local Storage)</li>
          <li>Look for the &quot;theme-preference&quot; key</li>
          <li>All colors use CSS variables that respond instantly</li>
        </ul>
      </div>
    </div>
  );
}

export default DarkModeTestComponent;
