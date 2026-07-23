import { addCollection } from '@iconify/svelte';
import mdi from './icons.generated.json';

// Register the bundled subset of mdi icons so <Icon icon="mdi:..."> renders
// fully offline. Without this @iconify/svelte fetches icon data from
// api.iconify.design at runtime, which the CSP connect-src does not allow.
// Regenerate the JSON with `npm run generate:icons` after adding icons.
addCollection(mdi);
