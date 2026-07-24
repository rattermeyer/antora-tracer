declare module 'js-yaml' {
  export function load(content: string): unknown;
  export function dump(object: unknown): string;
}
