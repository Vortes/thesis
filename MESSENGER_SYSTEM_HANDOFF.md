# Messenger Location & Status System - Handoff Document

**Last Updated**: 2025-12-06T23:24  
**Status**: Implementation complete, pending migration and testing

---

## Executive Summary

Implemented a messenger location tracking and status management system with a "ping-pong" mechanic where messengers alternate between users after each shipment.

---

## What Was Done

### 1. Schema Changes (`prisma/schema.prisma`)

**New `MessengerStatus` enum:**

```prisma
enum MessengerStatus {
  AVAILABLE  // Ready to accept new shipment
  LOADING    // User is composing a shipment
  IN_TRANSIT // Traveling to recipient
  WAITING    // Arrived, waiting for recipient to open/reply
  RETURNING  // Heading back after recall
}
```

**Updated `ShipmentStatus` enum:**

-   `DELIVERED` → renamed to `ARRIVED`
-   Added `RECALLED` status

**Updated `Messenger` model:**

-   Removed `isBusy` boolean
-   Added `status: MessengerStatus` (default: AVAILABLE)
-   Added `currentShipmentId: String?` (unique, relation to current shipment)
-   Added `currentHolderId: String?` (who can send next - ping-pong)
-   Added `shipments: Shipment[]` relation

**Updated `Shipment` model:**

-   Added `originLat`, `originLng`, `destLat`, `destLng` (Float?) - coordinate snapshots
-   Added `messengerId: String?` - relation to messenger
-   Added `recalledAt: DateTime?` - for recall functionality

---

### 2. New Server Actions

#### `app/actions/recall-shipment.ts`

-   Allows sender to recall in-transit shipments
-   Sets `shipment.status = RECALLED`, `shipment.recalledAt = now()`
-   Sets `messenger.status = RETURNING`

#### `app/actions/open-shipment.ts`

-   Marks shipment as opened by recipient
-   Sets `shipment.status = OPENED`
-   Messenger stays `WAITING` (awaiting reply, NOT available)

---

### 3. Updated Server Actions

#### `app/actions/shipment.ts`

Enhanced `createShipment` to:

1. Look up messenger for the connection between sender/recipient
2. Verify messenger is `AVAILABLE` and `currentHolderId` matches sender
3. Snapshot sender/recipient coordinates into shipment
4. Calculate `distanceInKm` using Haversine formula
5. Update messenger to `IN_TRANSIT` and set `currentShipmentId`

---

### 4. Data Fetching Updates

#### `app/utils/fetch-messengers.ts`

Completely rewritten to:

-   Use `@prisma/adapter-pg` (same as main prisma.ts)
-   Include `currentShipment` data for progress calculation
-   Fetch both users' coordinates from database
-   Return coordinates based on messenger status:
    -   `AVAILABLE`/`LOADING`: At currentHolder's location
    -   `IN_TRANSIT`: Origin + destination coords (frontend calculates position)
    -   `WAITING`: At recipient's location
    -   `RETURNING`: From current position back to origin
-   Return `canSend: boolean` and `shipmentData` for frontend

**⚠️ Known Issue (TODO):**

> Users getting "user not found" error because this is called everywhere without type checking first

---

### 5. Frontend Updates

#### `lib/dashboard-data.ts`

Extended `Character` interface:

-   New statuses: `'Ready' | 'En Route' | 'Waiting' | 'Returning' | 'Loading'`
-   Added `originCoords?: { lng, lat }`
-   Added `canSend: boolean`
-   Added `shipmentData?: { shipmentId, dispatchedAt, recalledAt?, distanceInKm }`

#### `components/dashboard/map/Map.tsx`

-   Added `pathsRef` to store bezier paths
-   Added `animationRef` for requestAnimationFrame loop
-   Added `calculateProgress()` using shipment timestamps
-   Travel speed: 1km = 3 seconds (3000ms) - configurable via `TRAVEL_SPEED_MS_PER_KM`
-   Return trip: 1/4 of time already traveled
-   Visual indicators for `Waiting` (yellow ?) and `Returning` statuses
-   **ETA Display**: Added `calculateETA()` and `formatETA()` for live countdown (e.g., "5m 30s")
-   **Conditional CREATE GIFT button**: Only shows when `canSend` is true
-   **Progress bar**: Uses shadcn `<Progress>` component

#### `components/dashboard/history/History.tsx`

-   Changed `DELIVERED` references to `ARRIVED`
-   Added `OPENED` status support

#### `app/(home)/[charId]/history/page.tsx`

-   Updated status filter to use `ARRIVED`, `IN_TRANSIT`, `OPENED`

---

### 6. Seed File Updates

#### `prisma/seed.ts` & `prisma/seed.js`

-   Updated to use `@prisma/adapter-pg` pattern
-   Added real city coordinates for each test user
-   Added `MessengerStatus.AVAILABLE` and `currentHolderId` to messengers
-   Target user ID: `user_36V5TUZuhfeAtMHpkRE8PBVBOcV`

#### `prisma.config.ts`

-   Added seed command: `pnpx tsx prisma/seed.ts`

---

## Ping-Pong Mechanic

```
User A sends → Messenger travels to B → B opens → Messenger WAITS at B
B composes reply → Messenger travels to A → A opens → Messenger WAITS at A
...repeat...
```

Key rules:

-   Messenger starts with connection initiator
-   Only the `currentHolderId` can send
-   After recipient opens, messenger stays `WAITING` until they compose a reply
-   Sender can recall in-transit shipments (return time = 1/4 of time out)

---

## Open Issues / TODOs

### 1. User Not Found Error

Location: `app/utils/fetch-messengers.ts` line 1

```typescript
// TODO: users are getting user not found error bc this is called everywhere without type checking first
```

### 2. Onboarding Flow Issue

Location: `app/actions/onboarding.ts` line 2

```typescript
//TODO: user not brought here immediately after sign up, could be due to fetchmessenger being called first? idk yet
```

### 3. Arrival Detection Not Implemented

When messenger reaches 100% progress, need to update status to `ARRIVED`. Options:

-   Frontend calls server action when animation reaches 100%
-   Server-side cron job checks periodically
-   Scheduled trigger based on `arrivalEstimate`

### 4. Travel Time Questions (Unanswered)

-   ~~Current: 1km = 1 minute~~ Updated: 1km = 3 seconds (for testing)
-   User may want different formula for production

---

## Verification Status

-   ✅ TypeScript compilation passes (`npx tsc --noEmit`)
-   ✅ Next.js build succeeds (`npm run build`)
-   ⚠️ Database migration NOT YET RUN
-   ⚠️ Seed NOT YET RUN
-   ⚠️ End-to-end testing NOT DONE

---

## Next Steps

1. **Run migration**:

    ```bash
    pnpm prisma migrate dev --name messenger_status_system
    ```

2. **Run seed**:

    ```bash
    pnpm prisma db seed
    ```

3. **Fix the "user not found" issue** in fetch-messengers.ts

4. **Implement arrival detection** - decide on approach and implement

5. **Test the full flow**:
    - Create shipment → verify IN_TRANSIT
    - Wait for arrival → verify ARRIVED
    - Open shipment → verify WAITING persists
    - Compose reply → verify return journey
    - Test recall during transit

---

## File Index

| File                                       | Status      | Description                          |
| ------------------------------------------ | ----------- | ------------------------------------ |
| `prisma/schema.prisma`                     | ✅ Modified | New enums, messenger/shipment fields |
| `app/actions/shipment.ts`                  | ✅ Modified | Messenger validation, coordinates    |
| `app/actions/recall-shipment.ts`           | ✅ New      | Recall in-transit shipments          |
| `app/actions/open-shipment.ts`             | ✅ New      | Mark shipment opened                 |
| `app/utils/fetch-messengers.ts`            | ✅ Modified | Real coords, shipment data           |
| `lib/dashboard-data.ts`                    | ✅ Modified | Extended Character interface         |
| `components/dashboard/map/Map.tsx`         | ✅ Modified | Animation loop, progress calc        |
| `components/dashboard/history/History.tsx` | ✅ Modified | ARRIVED/OPENED statuses              |
| `app/(home)/[charId]/history/page.tsx`     | ✅ Modified | Updated status filter                |
| `prisma/seed.ts`                           | ✅ Modified | New fields, coordinates              |
| `prisma/seed.js`                           | ✅ Modified | Synced with seed.ts                  |
| `prisma.config.ts`                         | ✅ Modified | Added seed command                   |
