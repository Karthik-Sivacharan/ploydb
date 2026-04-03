# Custom Cell Variants

Custom cell components that extend the built-in tablecn data-grid cell types.

## Variants

### `currency` (`src/components/cells/currency-cell.tsx`)

- **Based on:** `NumberCell`
- **Display:** Formatted currency string using `Intl.NumberFormat` (e.g., "$12,450.00")
- **Edit:** Plain number input (same as NumberCell), min=0, step=0.01
- **Props:** Standard `DataGridCellProps<TData>`
- **CellOpts:** `{ variant: "currency"; currencyCode?: string }`

### `percent` (`src/components/cells/percent-cell.tsx`)

- **Based on:** `NumberCell`
- **Display:** Number with "%" suffix (e.g., "73.2%")
- **Edit:** Number input with min=0, max=100, step=0.1
- **Props:** Standard `DataGridCellProps<TData>`
- **CellOpts:** `{ variant: "percent" }`

### `email` (`src/components/cells/email-cell.tsx`)

- **Based on:** `ShortTextCell`
- **Display:** Clickable `mailto:` link with `text-primary hover:underline` styling
- **Edit:** ContentEditable div (same as ShortTextCell)
- **Props:** Standard `DataGridCellProps<TData>`
- **CellOpts:** `{ variant: "email" }`

### `phone` (`src/components/cells/phone-cell.tsx`)

- **Based on:** `ShortTextCell`
- **Display:** Clickable `tel:` link with `text-primary hover:underline` styling. Non-digit characters are stripped from the `tel:` href.
- **Edit:** ContentEditable div (same as ShortTextCell)
- **Props:** Standard `DataGridCellProps<TData>`
- **CellOpts:** `{ variant: "phone" }`

### `location` (`src/components/cells/location-cell.tsx`)

- **Based on:** `ShortTextCell`
- **Display:** Text with a `MapPin` icon prefix (from lucide-react)
- **Edit:** ContentEditable div (same as ShortTextCell)
- **Props:** Standard `DataGridCellProps<TData>`
- **CellOpts:** `{ variant: "location" }`

## How to Add a New Custom Cell Variant

1. **Create the component** in `src/components/cells/<variant>-cell.tsx`:
   - Accept `DataGridCellProps<TData>` as props
   - Use `DataGridCellWrapper` as the outer container
   - Handle both display and edit modes
   - Call `tableMeta.onDataUpdate({ rowIndex, columnId, value })` to save
   - Call `tableMeta.onCellEditingStop()` when editing ends
   - Handle `Enter` (save + move down), `Tab` (save + move right), `Escape` (cancel)

2. **Add the variant to `CellOpts`** in `src/types/data-grid.ts`:
   ```ts
   | { variant: "my-variant"; optionalProp?: string }
   ```

3. **Register in the switch statement** in `src/components/data-grid/data-grid-cell.tsx`:
   ```tsx
   case "my-variant":
     Comp = MyVariantCell;
     break;
   ```

4. **Add column definition** in `src/data/columns.ts`:
   ```ts
   {
     id: "myField",
     accessorKey: "myField",
     header: "My Field",
     size: 160,
     meta: {
       label: "My Field",
       cell: { variant: "my-variant" },
     },
   }
   ```

5. **Add seed data** in `src/data/seed.ts` (update `CrmRow` interface and both hero rows and generated rows).
