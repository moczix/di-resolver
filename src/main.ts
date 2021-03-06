declare var Reflect: any;

type ClassConstructor = any;

interface Registration {
  ctor: ClassConstructor,
  deps: Function[],
  resolved: boolean,
}

interface TestProviders {
  provide:ClassConstructor,
  useClass: ClassConstructor
}

class DiContainer {
  private singletons: Function[] = [];
  private lazySingletons: Registration[] = [];
  private providers: Registration[] = [];
  private vars: {[key: string]: any} = {};
  private testMode: boolean = false;

  private static instance: DiContainer;
  private constructor() {
  }
  static getInstance() {
      if (!DiContainer.instance) {
        DiContainer.instance = new DiContainer();
      }
      return DiContainer.instance;
  }

  public registerProvider(ctor: ClassConstructor, deps: Function[]): void {
    this.providers.push({
      ctor, deps, resolved: false
    })
  }

  public registerLazySingleton(ctor: ClassConstructor, deps: Function[]): void {
    this.lazySingletons.push({
      ctor, deps, resolved: false
    })
  }

  public registerSingleton(ctor: ClassConstructor, deps: Function[]): void {
    this.singletons.push(new ctor(...this.resolveDeps(deps)));
  }

  public registerClassAsSingleton(instance: any): void {
    this.singletons.push(instance);
  }

  public registerVar(key: string, value: any): void {
    this.vars[key] = value;
  }

  private resolveSingleton(dep: Function): Function {
    // Singleton instance is created at registration time
    const resolvedSingletonDep = this.singletons.find(singleton => singleton instanceof dep);
    if (resolvedSingletonDep) {
      return resolvedSingletonDep;
    }
    return null;
  }

  private resolveLazySingleton(dep: Function): Function {
    // lazy singleton instance is created at first time when needed and transform to singleton
    const lazySingletonIndex: number = this.lazySingletons.findIndex(lazy => lazy.ctor === dep && lazy.resolved === false);
    if (lazySingletonIndex !== -1) {
      const lazyCtor = this.lazySingletons[lazySingletonIndex].ctor;
      const lazyDeps = this.lazySingletons[lazySingletonIndex].deps;
      const resolvedLazySingleton = new lazyCtor(...this.resolveDeps(lazyDeps))
      this.singletons.push(resolvedLazySingleton);
      this.lazySingletons[lazySingletonIndex].resolved = true;
      return resolvedLazySingleton;
    }
    return null;
  }

  private resolveProvider(dep: Function): Function {
    // created each time when needed
    const foundProvider = this.providers.find(provider => provider.ctor === dep);
    const providerCtor = foundProvider.ctor as any;
    return new providerCtor(...this.resolveDeps(foundProvider.deps))
  }

  private resolveDeps(deps: Function[], providers: TestProviders[] = []): any {
    return deps.map((dep: Function) => {

      if (providers.length) {
        const foundMock = providers.find(provider => provider.provide === dep);
        if (foundMock) {
          return foundMock.useClass;
        }
      }
      const resolvedSingleton = this.resolveSingleton(dep);
      if (resolvedSingleton) {
        return resolvedSingleton;
      }
      const resolvedLazySingleton = this.resolveLazySingleton(dep);
      if (resolvedLazySingleton) {
        return resolvedLazySingleton;
      } else {
        return this.resolveProvider(dep);
      }
    })
  }

  public resolve(ctor: any): any {
    const provider = this.providers.find(provider => provider.ctor === ctor);
    if (!provider) {
      console.log('cant find registered provider', ctor);
      return;
    }
    const resolvedDeps = this.resolveDeps(provider.deps);
    return new ctor(...resolvedDeps);
  }

  public resolveTesting(ctor: any, providers?: TestProviders[]): any {
    const provider = this.providers.find(provider => provider.ctor === ctor);
    if (!provider) {
      console.log('cant find registered provider', ctor);
      return;
    }
    const resolvedDeps = this.resolveDeps(provider.deps, providers);
    return new ctor(...resolvedDeps);
  }

  public resolveVar<T>(key: string): T {
    return this.vars[key];
  }

  public enableTestMode(): void {
    this.testMode = true;
  }

  public disableTestMode(): void {
    this.testMode = false;
  }

  public isTestModeEnable(): boolean {
    return this.testMode;
  }
}


export class DiResolver {

  public static registerProvider(ctor: Function, deps: Function[]): void {
    DiContainer.getInstance().registerProvider(ctor, deps);
  }

  public static registerSingleton(ctor: Function, deps: Function[]): void {
    DiContainer.getInstance().registerSingleton(ctor, deps);
  }

  public static registerLazySingleton(ctor: Function, deps: Function[]): void {
    DiContainer.getInstance().registerLazySingleton(ctor, deps);
  }
  
  public static resolve<T>(className: Function): T {
    return DiContainer.getInstance().resolve(className);
  }

  public static resolveVar<T>(key: string): T {
    return DiContainer.getInstance().resolveVar(key);
  }

  public static setVar<T>(key: string, value: T): void {
    DiContainer.getInstance().registerVar(key, value);
  }

  public static resolveTesting<T>(className: Function, providers?: TestProviders[]): T {
    return DiContainer.getInstance().resolveTesting(className, providers);
  }

  public static registerClassAsSingleton(instance: any): void {
    DiContainer.getInstance().registerClassAsSingleton(instance);
  }

  public static enableTestMode(): void {
    DiContainer.getInstance().enableTestMode();
  }

  public static disableTestMode(): void {
    DiContainer.getInstance().disableTestMode();
  }

  public static isTestModeDisabled(): boolean {
    return !DiContainer.getInstance().isTestModeEnable();
  }

  public static isTestModeEnable(): boolean {
    return DiContainer.getInstance().isTestModeEnable();
  }
}

export function Provide(deps: Function[] = []) {
  return (ctor: Function) => {
    checkParamsIsCorrect(ctor, deps, 'Provide');
    DiResolver.registerProvider(ctor, deps);
  }
}

export function Singleton(deps: Function[] = []) {
  return (ctor: Function) => {
    checkParamsIsCorrect(ctor, deps, 'Singleton');
    DiResolver.registerSingleton(ctor, deps);
  }
}

export function LazySingleton(deps: Function[] = []) {
  return (ctor: Function) => {
    checkParamsIsCorrect(ctor, deps, 'LazySingleton');
    DiResolver.registerLazySingleton(ctor, deps);
  }
}

export function enableTestMode(): void {
  DiResolver.enableTestMode();
}

export function disableTestMode(): void {
  DiResolver.disableTestMode();
}

function checkParamsIsCorrect(ctor: Function, deps: Function[], decoratorName: string): void {
  if (Reflect && Reflect.getMetadata && DiResolver.isTestModeDisabled()) {
    const params: any[] = Reflect.getMetadata("design:paramtypes", ctor) || [];
    if (deps.length !== params.length) {
      console.error('WRONG LENGTH OF DEPS FOR CLASS (check decorator and constructor)', ctor);
      console.log('DECORATOR "'+ decoratorName + '" has deps', deps);
      console.log('CONSTRUCTOR has deps', params);
    }
    const depsAreCorrect: boolean = deps.every((dep: any, index) => 
      new dep() instanceof params[index]
    )
    if (!depsAreCorrect) {
      console.error('WRONG TYPE FOR CONSTRUCTOR (check decorator and constructor)', ctor);
      console.log('DECORATOR "Provide" has deps', deps);
      console.log('CONSTRUCTOR has deps', params);
    }
  }
}