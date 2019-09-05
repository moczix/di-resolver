(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define('di-resolver', ['exports'], factory) :
  (global = global || self, factory(global.DiResolver = {}));
}(this, function (exports) { 'use strict';

  var DiContainer = /** @class */ (function () {
      function DiContainer() {
          this.singletons = [];
          this.lazySingletons = [];
          this.providers = [];
          this.vars = {};
          this.testMode = false;
      }
      DiContainer.getInstance = function () {
          if (!DiContainer.instance) {
              DiContainer.instance = new DiContainer();
          }
          return DiContainer.instance;
      };
      DiContainer.prototype.registerProvider = function (ctor, deps) {
          this.providers.push({
              ctor: ctor, deps: deps, resolved: false
          });
      };
      DiContainer.prototype.registerLazySingleton = function (ctor, deps) {
          this.lazySingletons.push({
              ctor: ctor, deps: deps, resolved: false
          });
      };
      DiContainer.prototype.registerSingleton = function (ctor, deps) {
          this.singletons.push(new (ctor.bind.apply(ctor, [void 0].concat(this.resolveDeps(deps))))());
      };
      DiContainer.prototype.registerClassAsSingleton = function (instance) {
          this.singletons.push(instance);
      };
      DiContainer.prototype.registerVar = function (key, value) {
          this.vars[key] = value;
      };
      DiContainer.prototype.resolveSingleton = function (dep) {
          // Singleton instance is created at registration time
          var resolvedSingletonDep = this.singletons.find(function (singleton) { return singleton instanceof dep; });
          if (resolvedSingletonDep) {
              return resolvedSingletonDep;
          }
          return null;
      };
      DiContainer.prototype.resolveLazySingleton = function (dep) {
          // lazy singleton instance is created at first time when needed and transform to singleton
          var lazySingletonIndex = this.lazySingletons.findIndex(function (lazy) { return lazy.ctor === dep && lazy.resolved === false; });
          if (lazySingletonIndex !== -1) {
              var lazyCtor = this.lazySingletons[lazySingletonIndex].ctor;
              var lazyDeps = this.lazySingletons[lazySingletonIndex].deps;
              var resolvedLazySingleton = new (lazyCtor.bind.apply(lazyCtor, [void 0].concat(this.resolveDeps(lazyDeps))))();
              this.singletons.push(resolvedLazySingleton);
              this.lazySingletons[lazySingletonIndex].resolved = true;
              return resolvedLazySingleton;
          }
          return null;
      };
      DiContainer.prototype.resolveProvider = function (dep) {
          // created each time when needed
          var foundProvider = this.providers.find(function (provider) { return provider.ctor === dep; });
          var providerCtor = foundProvider.ctor;
          return new (providerCtor.bind.apply(providerCtor, [void 0].concat(this.resolveDeps(foundProvider.deps))))();
      };
      DiContainer.prototype.resolveDeps = function (deps, providers) {
          var _this = this;
          if (providers === void 0) { providers = []; }
          return deps.map(function (dep) {
              if (providers.length) {
                  var foundMock = providers.find(function (provider) { return provider.provide === dep; });
                  if (foundMock) {
                      return foundMock.useClass;
                  }
              }
              var resolvedSingleton = _this.resolveSingleton(dep);
              if (resolvedSingleton) {
                  return resolvedSingleton;
              }
              var resolvedLazySingleton = _this.resolveLazySingleton(dep);
              if (resolvedLazySingleton) {
                  return resolvedLazySingleton;
              }
              else {
                  return _this.resolveProvider(dep);
              }
          });
      };
      DiContainer.prototype.resolve = function (ctor) {
          var provider = this.providers.find(function (provider) { return provider.ctor === ctor; });
          if (!provider) {
              console.log('cant find registered provider', ctor);
              return;
          }
          var resolvedDeps = this.resolveDeps(provider.deps);
          return new (ctor.bind.apply(ctor, [void 0].concat(resolvedDeps)))();
      };
      DiContainer.prototype.resolveTesting = function (ctor, providers) {
          var provider = this.providers.find(function (provider) { return provider.ctor === ctor; });
          if (!provider) {
              console.log('cant find registered provider', ctor);
              return;
          }
          var resolvedDeps = this.resolveDeps(provider.deps, providers);
          return new (ctor.bind.apply(ctor, [void 0].concat(resolvedDeps)))();
      };
      DiContainer.prototype.resolveVar = function (key) {
          return this.vars[key];
      };
      DiContainer.prototype.enableTestMode = function () {
          this.testMode = true;
      };
      DiContainer.prototype.disableTestMode = function () {
          this.testMode = false;
      };
      DiContainer.prototype.isTestModeEnable = function () {
          return this.testMode;
      };
      return DiContainer;
  }());
  var DiResolver = /** @class */ (function () {
      function DiResolver() {
      }
      DiResolver.registerProvider = function (ctor, deps) {
          DiContainer.getInstance().registerProvider(ctor, deps);
      };
      DiResolver.registerSingleton = function (ctor, deps) {
          DiContainer.getInstance().registerSingleton(ctor, deps);
      };
      DiResolver.registerLazySingleton = function (ctor, deps) {
          DiContainer.getInstance().registerLazySingleton(ctor, deps);
      };
      DiResolver.resolve = function (className) {
          return DiContainer.getInstance().resolve(className);
      };
      DiResolver.resolveVar = function (key) {
          return DiContainer.getInstance().resolveVar(key);
      };
      DiResolver.setVar = function (key, value) {
          DiContainer.getInstance().registerVar(key, value);
      };
      DiResolver.resolveTesting = function (className, providers) {
          return DiContainer.getInstance().resolveTesting(className, providers);
      };
      DiResolver.registerClassAsSingleton = function (instance) {
          DiContainer.getInstance().registerClassAsSingleton(instance);
      };
      DiResolver.enableTestMode = function () {
          DiContainer.getInstance().enableTestMode();
      };
      DiResolver.disableTestMode = function () {
          DiContainer.getInstance().disableTestMode();
      };
      DiResolver.isTestModeDisabled = function () {
          return !DiContainer.getInstance().isTestModeEnable();
      };
      DiResolver.isTestModeEnable = function () {
          return DiContainer.getInstance().isTestModeEnable();
      };
      return DiResolver;
  }());
  function Provide(deps) {
      if (deps === void 0) { deps = []; }
      return function (ctor) {
          checkParamsIsCorrect(ctor, deps, 'Provide');
          DiResolver.registerProvider(ctor, deps);
      };
  }
  function Singleton(deps) {
      if (deps === void 0) { deps = []; }
      return function (ctor) {
          checkParamsIsCorrect(ctor, deps, 'Singleton');
          DiResolver.registerSingleton(ctor, deps);
      };
  }
  function LazySingleton(deps) {
      if (deps === void 0) { deps = []; }
      return function (ctor) {
          checkParamsIsCorrect(ctor, deps, 'LazySingleton');
          DiResolver.registerLazySingleton(ctor, deps);
      };
  }
  function enableTestMode() {
      DiResolver.enableTestMode();
  }
  function disableTestMode() {
      DiResolver.disableTestMode();
  }
  function checkParamsIsCorrect(ctor, deps, decoratorName) {
      if (Reflect && Reflect.getMetadata && DiResolver.isTestModeDisabled()) {
          var params_1 = Reflect.getMetadata("design:paramtypes", ctor) || [];
          if (deps.length !== params_1.length) {
              console.error('WRONG LENGTH OF DEPS FOR CLASS (check decorator and constructor)', ctor);
              console.log('DECORATOR "' + decoratorName + '" has deps', deps);
              console.log('CONSTRUCTOR has deps', params_1);
          }
          var depsAreCorrect = deps.every(function (dep, index) {
              return new dep() instanceof params_1[index];
          });
          if (!depsAreCorrect) {
              console.error('WRONG TYPE FOR CONSTRUCTOR (check decorator and constructor)', ctor);
              console.log('DECORATOR "Provide" has deps', deps);
              console.log('CONSTRUCTOR has deps', params_1);
          }
      }
  }

  exports.DiResolver = DiResolver;
  exports.LazySingleton = LazySingleton;
  exports.Provide = Provide;
  exports.Singleton = Singleton;
  exports.disableTestMode = disableTestMode;
  exports.enableTestMode = enableTestMode;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
