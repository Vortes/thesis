# Map Feature Implementation Log

> Created: 2025-12-05  
> Purpose: Context for future agents working on the map feature

## Requirements

The user requested:

1. **Real map integration** for the dashboard using Mapbox GL JS
2. **Messenger visualization** showing couriers on the map with their icons/pins
3. **Travel animation** indicating messenger journey (visual aid, not accurate data)
4. **Cost-effective solution** - free tier sufficient since travel data is trivial
5. **Customizable styling** matching the app's retro pixel-art aesthetic

## Design Decisions

### Map Library: Mapbox GL JS

-   Chosen for generous free tier (50k loads/month) and extensive style customization
-   Uses OSM raster tiles with custom paint properties for retro look
-   Alternative considered: Leaflet + OpenStreetMap (less styling control)

### Travel Animation Pattern

-   **Fake routes**: Bezier curves generated between origin and destination using Turf.js
-   **No real geocoding/routing**: Coordinates are deterministically generated from messenger IDs
-   **Progress-based positioning**: Markers interpolated along paths using `turf.along()`

### Coordinate System Change

Changed from percentage-based (`x/y`) to geographic (`lng/lat`) coordinates:

```typescript
// Before
coords: { x: number; y: number }

// After
coords: { lng: number; lat: number }
destCoords?: { lng: number; lat: number }
```

## Files Modified

| File                                        | Changes                                                                                  |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `components/dashboard/map/Map.tsx`          | Complete rewrite with Mapbox GL, custom retro style, bezier paths, animated markers      |
| `lib/dashboard-data.ts`                     | Updated `Character` interface: `coords` now uses `lng/lat`, added `destCoords`, `skinId` |
| `app/utils/fetch-messengers.ts`             | Added coordinate generation functions, includes `skinId` from DB                         |
| `app/(home)/page.tsx`                       | Passes `characters` array to Map component                                               |
| `components/dashboard/map/CharacterPin.tsx` | Updated to use `lng/lat` (legacy component, markers now rendered inline)                 |

## Dependencies Added

```bash
pnpm add mapbox-gl @turf/turf
pnpm add -D @types/mapbox-gl
```

## Environment Variables Required

```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
```

## Architecture Notes

### Map Component Props

```typescript
interface MapProps {
    selectedChar: Character | null; // Currently selected messenger
    characters?: Character[]; // All messengers to display
    onSelectChar?: (char: Character) => void; // Selection callback
}
```

### Marker Rendering

Markers are created as custom HTML elements (not React components) to work with Mapbox's marker API:

-   Quest marker (!) shown for "Ready" status
-   Pulse ring animation for "En Route" status
-   Colored avatar box with pixel-art styling

### Path Drawing

For "En Route" messengers:

1. Generate bezier curve between `coords` and `destCoords`
2. Add as GeoJSON source to map
3. Render as dashed line with messenger's color
4. Position marker at progress percentage along path

## Known Limitations

1. **CharacterPin.tsx is legacy** - markers now rendered directly in Map.tsx
2. **Coordinates are fake** - deterministic hash of messenger ID, not real locations
3. **No live updates** - progress is static per page load (could add polling/WebSocket later)
4. **skinId not yet used visually** - sprites could replace colored boxes

## Future Enhancements

-   [ ] Use actual sprite images based on `skinId`
-   [ ] Real-time progress updates via WebSocket
-   [ ] Animate marker movement along path over time
-   [ ] User location as origin point
-   [ ] Custom Mapbox Studio style for more control
