# HauMail Codebase Agent

This document provides specialized guidance for implementing features in the HauMail codebase.

## Architecture Patterns

### Feature Implementation Flow

When implementing a new feature, follow this order:

1. **Schema Review** - Check `prisma/schema.prisma` for existing models that support the feature
2. **Server Actions** - Create in `app/actions/` for mutations
3. **Data Fetching** - Create in `app/utils/` for read operations
4. **Loader Components** - Update/create server components that fetch data
5. **UI Components** - Create client components in `components/dashboard/`

### Server Actions Pattern

Location: `app/actions/<feature>.ts`

```typescript
'use server';

import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Define result type for consistent error handling
export type ActionResult =
    | { success: true }
    | { success: false; error: string }
    | { success: false; customFlag: true; data: any }; // For special cases

export async function actionName(param: string): Promise<ActionResult> {
    // 1. Auth check
    const user = await currentUser();
    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // 2. Get DB user
    const dbUser = await prisma.user.findUnique({
        where: { email: user.emailAddresses[0].emailAddress }
    });
    if (!dbUser) {
        return { success: false, error: 'User not found in database' };
    }

    // 3. Validate permissions/ownership
    // 4. Perform mutation
    // 5. Revalidate and return
    revalidatePath('/');
    return { success: true };
}
```

### Data Fetching Pattern

Location: `app/utils/fetch-<feature>.ts`

```typescript
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// Define interface for frontend consumption
export interface FeatureData {
    id: string;
    // ... typed fields
}

export async function fetchFeatureData(): Promise<FeatureData[]> {
    const user = await currentUser();
    if (!user) {
        return [];
    }

    const dbUser = await prisma.user.findUnique({
        where: { email: user.emailAddresses[0].emailAddress }
    });
    if (!dbUser) {
        return [];
    }

    // Fetch and transform data
    const data = await prisma.model.findMany({
        where: { /* conditions */ },
        include: { /* relations */ }
    });

    // Transform to frontend interface
    return data.map(item => ({
        id: item.id,
        // ... map fields
    }));
}
```

### Server Component Loader Pattern

Location: `components/dashboard/<feature>/<Feature>Loader.tsx`

```typescript
import { fetchFeatureData } from "@/app/utils/fetch-feature";
import { FeatureComponent } from "./FeatureComponent";

export const FeatureLoader = async () => {
    const data = await fetchFeatureData();
    return <FeatureComponent data={data} />;
};
```

### Client Component Pattern

Location: `components/dashboard/<feature>/<Component>.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { serverAction } from '@/app/actions/feature';

interface Props {
    data: FeatureData[];
}

export const Component: React.FC<Props> = ({ data }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAction = async () => {
        setLoading(true);
        setError(null);

        const result = await serverAction();

        setLoading(false);

        if (result.success) {
            router.refresh(); // Trigger server component re-fetch
        } else if ('error' in result) {
            setError(result.error);
        }
    };

    return (/* JSX */);
};
```

---

## Design System

### CSS Classes

| Class | Usage |
|-------|-------|
| `pixel-border` | Large pixel-art box shadow border |
| `pixel-border-sm` | Small pixel-art box shadow border |
| `font-pixel` | Press Start 2P - UI labels, buttons (use text-[8px]) |
| `font-handheld` | VT323 - Content text (use text-base to text-lg) |

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Dark wood | `#4a3b2a` | Primary text, dark buttons |
| Medium wood | `#5e4c35` | Headers, accents |
| Light wood | `#8b7355` | Borders, dividers |
| Tan | `#a08560` | Secondary backgrounds |
| Beige | `#c4a574` | Primary backgrounds |
| Cream | `#e0d5c1` | Light text on dark |
| Paper | `#fdfbf7` | Content areas, inputs |

### Button Patterns

```tsx
// Primary action button
<button className="px-4 py-2 bg-[#4a3b2a] text-[#e0d5c1] font-pixel text-[8px] hover:bg-[#5e4c35] disabled:opacity-50 pixel-border-sm">
    ACTION
</button>

// Secondary/cancel button
<button className="px-3 py-2 bg-[#a08560] text-[#e0d5c1] font-pixel text-[8px] hover:bg-[#8b7355]">
    CANCEL
</button>

// Dashed outline button (for "add new" actions)
<button className="w-full py-3 border-2 border-dashed border-[#6d5a43] text-[#6d5a43] font-pixel text-[8px] hover:bg-[#8b7355] hover:text-[#e0d5c1] transition-colors opacity-50 hover:opacity-100">
    + ADD NEW
</button>
```

### Input Pattern

```tsx
<input
    type="text"
    className="w-full px-3 py-2 bg-[#fdfbf7] border-2 border-[#6d5a43] font-handheld text-lg text-[#4a3b2a] placeholder:text-[#a08560] focus:outline-none focus:border-[#4a3b2a]"
/>
```

### Modal Pattern

Use the Dialog component from `components/ui/dialog.tsx`:

```tsx
<Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>{trigger}</DialogTrigger>
    <DialogContent
        className="bg-[#c4a574] border-none p-0 pixel-border max-w-md gap-0 rounded-none"
        showCloseButton={false}
    >
        <DialogHeader className="bg-[#5e4c35] p-4">
            <DialogTitle className="font-pixel text-sm text-[#e0d5c1] flex items-center gap-2">
                <Icon className="w-4 h-4" />
                TITLE
            </DialogTitle>
        </DialogHeader>
        <div className="p-4">
            {/* Content */}
        </div>
    </DialogContent>
</Dialog>
```

### Error/Success Messages

```tsx
{error && (
    <div className="p-2 bg-red-100 border-2 border-red-400 text-red-700 font-handheld text-sm">
        {error}
    </div>
)}

{success && (
    <div className="p-2 bg-green-100 border-2 border-green-500 text-green-700 font-handheld text-sm">
        {success}
    </div>
)}
```

---

## Key Domain Concepts

### Connection & Messenger Relationship

- **Connection**: Friendship between two users (initiator/recipient)
- **Messenger**: Virtual courier belonging to a Connection
- **Shipment**: Package of GiftItems traveling between users

### Messenger Holder Logic

The `currentHolderId` determines who can send next:
- When accepting a friend request: recipient holds first
- After opening a shipment: recipient now holds
- Only the holder can create new shipments

### Status Enums

**ConnectionStatus**: `PENDING` | `ACCEPTED` | `ACTIVE` | `BLOCKED`

**MessengerStatus**: `AVAILABLE` | `LOADING` | `IN_TRANSIT` | `WAITING` | `RETURNING`

**ShipmentStatus**: `DRAFTING` | `IN_TRANSIT` | `ARRIVED` | `OPENED` | `RECALLED`

---

## File Organization

```
app/
  actions/           # Server actions for mutations
    shipment.ts      # createShipment, etc.
    friend-request.ts
  api/               # API routes (for external services)
    invite/route.ts
  utils/             # Data fetching functions
    fetch-messengers.ts
    fetch-friend-requests.ts
  invite/[token]/    # Dynamic routes

components/
  dashboard/
    sidebar/         # Sidebar components
    map/             # Map visualization
    compose/         # Shipment composition
    open/            # Opening shipments
    friends/         # Friend management
    history/         # Shipment history
  ui/                # Reusable UI primitives (shadcn)

lib/
  prisma.ts          # Prisma client
  dashboard-data.ts  # TypeScript interfaces
  utils.ts           # Utility functions
```

---

## Common Tasks

### Adding a New Feature

1. Check if schema changes needed in `prisma/schema.prisma`
2. Create server action in `app/actions/<feature>.ts`
3. Create data fetcher in `app/utils/fetch-<feature>.ts`
4. Create UI components in `components/dashboard/<feature>/`
5. Wire up to existing loaders/components

### Adding to Sidebar

1. Add data fetching to `SidebarLoader.tsx`
2. Add props to `Sidebar.tsx` interface
3. Add UI elements using design system patterns

### Creating Modals

1. Use Dialog from `components/ui/dialog.tsx`
2. Follow the pixel-art styling pattern
3. Use `router.refresh()` after successful mutations

### API Integrations

- **Auth**: Clerk (`@clerk/nextjs`)
- **Database**: Prisma with PostgreSQL
- **File uploads**: Uploadthing
- **Maps**: Mapbox GL
- **Email**: Resend via `lib/mail.ts`
