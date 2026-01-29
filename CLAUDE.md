# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HauMail is a Next.js 16 application for sending virtual "gifts" between friends via animated messengers on a map. Users connect with friends, and a shared messenger travels between them carrying shipments containing text, audio, photos, and drawings. The messenger follows a "ping-pong" mechanic—only the user who currently "holds" the messenger can send.

## Commands

```bash
bun dev          # Start development server (localhost:3000)
bun run build    # Production build
bun run lint     # Run ESLint

# Database
bun prisma migrate dev --name <migration_name>  # Create and apply migration
bun prisma db seed                              # Seed database
bun prisma generate                             # Regenerate Prisma client
bun prisma studio                               # Open Prisma Studio GUI
```

## Architecture

### Core Domain Model

The system revolves around **Connections**, **Messengers**, and **Shipments**:

- **Connection**: A friendship between two users. Each connection has exactly one Messenger.
- **Messenger**: A virtual courier that belongs to a Connection. Tracks `currentHolderId` (who can send next) and `status` (AVAILABLE, IN_TRANSIT, WAITING, RETURNING).
- **Shipment**: A package of GiftItems traveling from sender to recipient. Has `status` (IN_TRANSIT, ARRIVED, OPENED, RECALLED).

### Ping-Pong Flow

```
User A sends → Messenger IN_TRANSIT to B → B opens → Messenger WAITING at B
B sends reply → Messenger IN_TRANSIT to A → A opens → Messenger WAITING at A
```

Key constraint: Only the `currentHolderId` can create a new shipment. After recipient opens a gift, they must reply before the sender can send again.

### Directory Structure

- `app/actions/` - Server actions for shipment lifecycle (create, arrive, open, recall)
- `app/utils/fetch-messengers.ts` - Main data fetcher that builds `Character` objects for the frontend
- `components/dashboard/` - UI components organized by feature (map, compose, open, sidebar, history)
- `lib/dashboard-data.ts` - TypeScript interfaces for frontend data (`Character`, `Tool`)

### Key Files

- `prisma/schema.prisma` - Source of truth for data model and enums
- `app/actions/shipment.ts` - `createShipment()` - validates messenger availability, calculates distance, creates shipment
- `app/actions/arrive-shipment.ts` - `arriveShipment()` and `syncArrivedShipments()` - handle arrival detection
- `app/utils/fetch-messengers.ts` - Transforms DB data into frontend `Character` objects with coordinates and status
- `components/dashboard/map/Map.tsx` - Mapbox GL map with animated messenger markers and arrival detection
- `components/dashboard/map/utils/mapUtils.ts` - Progress calculation, ETA formatting, path interpolation

### Status Enums (from schema.prisma)

**MessengerStatus**: AVAILABLE → IN_TRANSIT → WAITING → (optionally RETURNING after recall)

**ShipmentStatus**: IN_TRANSIT → ARRIVED → OPENED (or RECALLED if sender cancels)

### External Services

- **Clerk**: Authentication (`@clerk/nextjs`)
- **Prisma + PostgreSQL**: Database with Neon adapter
- **Uploadthing**: File uploads for audio/images (text content stored as uploaded .txt files)
- **Mapbox GL**: Map visualization
- **Resend**: Email invitations

## Design System

The UI follows a "Game Boy Color Desk" aesthetic with pixel art styling:

- Use `pixel-border` and `pixel-border-sm` classes for hard-edged borders (via box-shadow, not CSS borders)
- Fonts: `font-pixel` (Press Start 2P) for UI labels, `font-handheld` (VT323) for content
- Colors: Wood tones (#8b7355, #a08560) for structure, paper white (#fdfbf7) for content areas
- Animations should feel mechanical, not fluid (see `design_guideline.txt` for details)

## Implementation Patterns

For detailed patterns and code examples, see `AGENT.md`. Key patterns:

### Feature Implementation Order
1. **Schema** - Check `prisma/schema.prisma` for existing support
2. **Server Actions** - `app/actions/<feature>.ts` for mutations
3. **Data Fetching** - `app/utils/fetch-<feature>.ts` for reads
4. **Loader** - Server component that fetches and passes to client
5. **UI Components** - `components/dashboard/<feature>/`

### Server Action Template
```typescript
'use server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type ActionResult = { success: true } | { success: false; error: string };

export async function actionName(param: string): Promise<ActionResult> {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const dbUser = await prisma.user.findUnique({
        where: { email: user.emailAddresses[0].emailAddress }
    });
    if (!dbUser) return { success: false, error: 'User not found' };

    // Validate, mutate, revalidate
    revalidatePath('/');
    return { success: true };
}
```

### Client Component Pattern
- Use `useState` for loading/error states
- Call server actions directly (no API routes needed)
- Use `router.refresh()` after successful mutations to trigger re-fetch
- Follow design system colors and fonts

### Color Reference
| Usage | Hex |
|-------|-----|
| Dark text/buttons | `#4a3b2a` |
| Headers | `#5e4c35` |
| Borders | `#8b7355` |
| Secondary bg | `#a08560` |
| Primary bg | `#c4a574` |
| Light text | `#e0d5c1` |
| Paper/inputs | `#fdfbf7` |
