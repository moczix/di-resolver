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
    static getSingletonInstance<T>(className: Function): T;
    static resolveTesting<T>(className: Function, providers?: TestProviders[]): T;
    static registerClassAsSingleton(instance: any): void;
}
export declare function Provide(deps?: Function[]): (ctor: Function) => void;
export declare function Singleton(deps?: Function[]): (ctor: Function) => void;
export declare function LazySingleton(deps?: Function[]): (ctor: Function) => void;
export {};
