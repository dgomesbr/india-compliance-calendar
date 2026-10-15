// Allow CSS custom properties in Preact style objects.
import 'preact';

declare module 'preact' {
  namespace JSX {
    interface CSSProperties {
      [key: `--${string}`]: string | number | undefined;
    }
  }
}
