import { ICONS, type IconName } from '../lib/icons.ts';

export function Icon({ name, class: cls = 'icon' }: { name: IconName; class?: string }) {
  return (
    <svg
      class={cls}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}
