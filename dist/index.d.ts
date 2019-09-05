declare type ClassConstructor = any;
interface TestProviders {
    provide: ClassConstructor;
    useClass: ClassConstructor;
}
export declare class DiResolver {
    static registerProvider(ctor: Function, deps: Function[]): void;
    static registerSingleton(ctor: Function, deps: Function[]): void;
    static registerLazySingleton(ctor: Function, deps: Function[]): void;
    static resolve<T>(className: Function): T;
    static resolveVar<T>(key: string): T;
    static setVar<T>(key: string, value: T): void;
    static resolveTesting<T>(className: Function, providers?: TestProviders[]): T;
    static registerClassAsSingleton(instance: any): void;
    static enableTestMode(): void;
    static disableTestMode(): void;
    static isTestModeDisabled(): boolean;
}
export declare function Provide(deps?: Function[]): (ctor: Function) => void;
export declare function Singleton(deps?: Function[]): (ctor: Function) => void;
export declare function LazySingleton(deps?: Function[]): (ctor: Function) => void;
export declare function enableTestMode(): void;
export {};
