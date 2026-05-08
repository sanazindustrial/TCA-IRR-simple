// Workspace-level module shims for incomplete local source snapshots.
// These declarations unblock TypeScript diagnostics when referenced modules
// are provided in another deployment package or generated at build time.

declare module 'lucide-react';
declare module 'next' {
	export type Metadata = any;
}
declare module '*.css';

declare module 'next/navigation' {
	export const useRouter: () => any;
	export const usePathname: () => string;
	export const useSearchParams: () => any;
	export const redirect: (path: string) => never;
}

declare module 'next/link' {
	const Link: any;
	export default Link;
}

declare module 'next/server' {
	export type NextRequest = any;
	export const NextResponse: any;
}

declare module 'react' {
	export function useState<T>(initial: T | (() => T)): [T, (val: T | ((prev: T) => T)) => void];
	export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
	export function useRef<T = any>(initial?: T): { current: T };
	export function useCallback<T extends (...args: any[]) => any>(fn: T, deps: readonly any[]): T;
	export function useMemo<T>(fn: () => T, deps: readonly any[]): T;
	export function useContext<T>(ctx: any): T;
	export function createContext<T>(defaultValue: T): any;
	export function forwardRef(render: any): any;
	export function memo(component: any): any;
	export const Suspense: any;
	export const Fragment: any;
	export type ReactNode = any;
	export type ReactElement = any;
	export type FC<P = {}> = (props: P & { children?: any }) => any;
	export type ComponentType<P = {}> = FC<P>;
	export type RefObject<T> = { current: T | null };
	export type MutableRefObject<T> = { current: T };
	export type FormEvent<T = Element> = any;
	export type ChangeEvent<T = Element> = any;
	export type DragEvent<T = Element> = any;
	export type MouseEvent<T = Element> = any;
	export type KeyboardEvent<T = Element> = any;
	export type FocusEvent<T = Element> = any;
	export type CSSProperties = Record<string, any>;
	export type Dispatch<A> = (value: A) => void;
	export type SetStateAction<S> = S | ((prevState: S) => S);
	export type PropsWithChildren<P = {}> = P & { children?: ReactNode };
	const React: any;
	export default React;
}

declare namespace React {
	type ReactNode = any;
	type ReactElement = any;
	type FC<P = {}> = (props: P) => any;
	type ComponentType<P = {}> = FC<P>;
	type RefObject<T> = { current: T | null };
	type MutableRefObject<T> = { current: T };
	type FormEvent<T = Element> = any;
	type ChangeEvent<T = Element> = any;
	type DragEvent<T = Element> = any;
	type MouseEvent<T = Element> = any;
	type KeyboardEvent<T = Element> = any;
	type FocusEvent<T = Element> = any;
	type CSSProperties = Record<string, any>;
	type Dispatch<A> = (value: A) => void;
	type SetStateAction<S> = S | ((prevState: S) => S);
	type PropsWithChildren<P = {}> = P & { children?: ReactNode };
}

declare var process: {
	env: Record<string, string | undefined>;
};

declare module '@/components/*';
declare module '@/hooks/*';
declare module '@/lib/*';
declare module '@/app/*';
declare module '@/ai/*';
