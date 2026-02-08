# Token Migration Plan

## Compatibility rule
Keep existing tokens active and map new semantic token groups without breaking current component usage.

## Token groups added
- Spacing: `--space-xs`, `--space-sm`, `--space-md`, `--space-lg`, `--space-xl`
- Radius: `--radius-sm`, `--radius-md`, `--radius-lg`
- Elevation: `--elevation-1`, `--elevation-2`, `--elevation-3`
- Motion: `--motion-duration-quick`, `--motion-duration-standard`, `--motion-ease-standard`
- Focus: `--focus-ring-color`, `--focus-ring-width`, `--focus-ring-offset`
- Status: `--success`, `--warning`, `--info`

## Tailwind mappings
- Colors: `success`, `warning`, `info`
- Box shadows: `shadow-elev-1`, `shadow-elev-2`, `shadow-elev-3`
- Duration: `duration-quick`, `duration-standard`
- Easing: `ease-standard`
- Radius: `sm`, `md`, `lg` mapped to new radius tokens

## Fallback rules
1. Keep previous `--radius` and base color tokens in place.
2. Keep legacy utility classes (`shadow-soft`, `shadow-medium`) backed by new elevation tokens.
3. Do not remove existing gradient variables.
4. If a new token is absent in a scoped theme, fallback to root token values.

## Rollout order
1. Introduce token variables.
2. Map Tailwind theme extensions.
3. Migrate shared primitives (`Button`, `Card`, `Input`, `Table`, `Badge`, `Dialog`, `Toast`).
4. Migrate role dashboards.
5. Migrate workflow pages by role.
