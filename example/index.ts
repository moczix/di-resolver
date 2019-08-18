import 'reflect-metadata';
import { Provide, Singleton, LazySingleton, DiResolver } from '../src/main';

@LazySingleton()
export class Dep3 {

}

@Singleton([Dep3])
export class Dep2 {

  constructor(private dep3: Dep3) {
  }
}

@Provide([Dep2])
export class Dep1 {

  constructor(private dep2: Dep2) {

  }
}

export class TestClass {

}

@Provide([Dep1, Dep2, Dep3])
export class Start {

  constructor(private dep1: Dep1, private dep2: Dep2, private dep3: Dep3) {
  }
}


const instance = DiResolver.resolveTesting(Start, [
  {
    provide: Dep1, useClass: new TestClass()
  }
]);
console.log('instance', instance);