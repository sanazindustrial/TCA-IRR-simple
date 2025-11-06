/// <reference types="react" />
/// <reference types="react-dom" />

declare module "react" {
    interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
        type: T;
        props: P;
        key: Key | null;
        children?: ReactNode | undefined;
    }
}