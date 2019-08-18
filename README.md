# Di-resolver

simple typescript runtime dependency injection which doesn't require reflect-metadata. Why we need this? If you have angular app, and want split your business logic apart from angular logic. You could use inversify or tsrynge, it would work to the moment when you run build aot. Angular compiler strips decorator metadata, and this Di frameworks doesn't work.

### Decorators

  - @Provide([deps: Function[]]) creates every time new instance of class
  - @Singleton([deps: Function[]]) create instance of class at registration time
  - @LazySingleton([deps: Function[]]) create instance of class at injection moment

### Example

```

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

@Provide([Dep1, Dep2, Dep3])
export class Start {

  constructor(private dep1: Dep1, private dep2: Dep2, private dep3: Dep3) {
  }
}


const instance = DiResolver.resolve(Start);
console.log('instance', instance);
```

### Example Test mock

```

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

const testClass = new TestClass();
const instance = DiResolver.resolveTesting(Start, [
  {
    provide: Dep1, useClass: testClass
  }
]);
console.log('instance', instance);
```