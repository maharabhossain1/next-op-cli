import type { ShadcnPreset } from '../types.js';

export function componentsJson(): string {
  return JSON.stringify(
    {
      $schema: 'https://ui.shadcn.com/schema.json',
      style: 'default',
      rsc: true,
      tsx: true,
      tailwind: {
        config: '',
        css: 'app/globals.css',
        baseColor: 'neutral',
        cssVariables: true,
        prefix: '',
      },
      aliases: {
        components: '@/components',
        utils: '@/lib/utils',
        ui: '@/components/ui',
        lib: '@/lib',
        hooks: '@/hooks',
      },
      iconLibrary: 'lucide',
    },
    null,
    2,
  );
}

export const MINIMAL_COMPONENTS = ['button', 'input', 'card', 'dialog', 'badge', 'separator'];

export const EXTENDED_COMPONENTS = [
  ...MINIMAL_COMPONENTS,
  'table',
  'select',
  'checkbox',
  'switch',
  'sonner',
  'dropdown-menu',
  'avatar',
  'skeleton',
  'tooltip',
  'label',
  'textarea',
  'alert',
];

export function getComponentsForPreset(preset: ShadcnPreset): string[] {
  if (preset === 'minimal') return MINIMAL_COMPONENTS;
  if (preset === 'extended') return EXTENDED_COMPONENTS;
  return [];
}
