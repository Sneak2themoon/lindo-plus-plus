// @ts-nocheck
import {Mod} from "../../mod"
import {SettingsService} from "@services/settings.service"

import { TranslateService } from "@ngx-translate/core"

export class Finder extends Mod {
  startMod(): void {
    return
  }

  constructor(wGame: any,settings: SettingsService,translate: TranslateService){
    super(wGame, settings, translate);
    //Logger.info("- finder active");
  }

  //singleton mirage "v2"
  public singleton(t){
    const e = this.wGame
    let n;
    const i = Object.values(e.singletons.c).filter(({exports: e})=>!(!e.prototype || !(t in e.prototype)) || t in e);
    return i.length > 1 ? (console.warn(`[MG] Singleton searcher found multiple results for key "${t}". Returning all of them.`),
    i.map(({exports: t})=>t)) : null === (n = i.pop()) || void 0 === n ? void 0 : n.exports
  }


  /**
   * Looks for a key matching the matcher in the Ankama's window objects
   * @param matcher Matcher to look for
   * @param maxDepth Maximum depth allowed
   * @param targetOverride Sets the target to search in (defaults to window)
   */
  public searchForKeyInWindowObjects(matcher: string | RegExp, maxDepth: number = 5, targetOverride: (window: any) => any, ) {
    const results = [];
    try {
      let target = this.wGame.window;
      target = target;

      if (!target) return;

      const results = [];
      const alreadySeenRefs = [];

      if (target === this.wGame.window) {
        const entries = this._getAnkamaPayload();

        results.push(
          ...Array.prototype.concat(
            [],
            ...entries.map(([key, value]) =>
              this._recursiveSearch(
                value,
                matcher,
                key,
                alreadySeenRefs,
                maxDepth,
                0,
              ),
            ),
          ),
        );
      } else {
        results.push(
          ...this._recursiveSearch(
            target,
            matcher,
            `[TARGET]`,
            alreadySeenRefs,
            maxDepth,
            0,
          ),
        );
      }
    } catch (error) {
    }
    

    return results;
  }

  /**
   * Looks for a key matching the matcher in the Ankama's singleton objects
   * @param matcher Matcher to look for
   * @param maxDepth Maximum depth allowed
   */
  public searchForKeyInSingletonObjects(matcher: string | RegExp, maxDepth: number = 5) {
    try {
      // @ts-ignore
      const singletons = Object.entries<any>(this.wGame.window.singletons.c)
      .map(([key, value]) => [key, value.exports])
      .filter(([key, value]) => this._isTargetWorthBrowsing(value, key));

      if (!singletons.length) return;

      const results = Array.prototype.concat(
        [],
        ...singletons.map(([key, value]) =>
          this._recursiveSearch(
            value,
            matcher,
            `singletons(${key})`,
            [],
            maxDepth,
            0,
          ),
        ),
      );

      return results;
    } catch (error) {
      
    }
  }

  /**
   * Looks for a singleton constructor with a given (set of) key(s)
   */
  public searchForSingletonConstructorWithKey(keys: string | string[]) {
    try {
      // @ts-ignore
      const singletons = Object.entries<any>(this.wGame.window.singletons.c)
      .map(([k, v]) => [k, v.exports])
      .filter(([k, v]) => typeof v === 'function');

      const results = singletons.filter(([, value]) => {
        const proto = value.prototype;
        if (!proto) return false;
        return typeof keys === 'string' ?
          keys in proto :
          keys.every((key) => Object.keys(proto).includes(key));
      });

      return results;
    } catch (error) {
      
    }
  }

  /**
   * Returns the singleton constructor matching the given (set of) key(s)
   */
  public getSingletonConstructorWithKey(key: string | string[]) {
    const results = this.searchForSingletonConstructorWithKey(key);

    if (results.length > 1)
      console.log(`[MIRAGE] More than one singleton class found !`);

    return results.pop()
  }

  /**
   * Returns the singleton object (or on of its children) matching the given matcher
   * @param matcher Matcher to look for
   * @param maxDepth Maximum depth allowed
   */
  public getSingletonObjectWithKey < T > (matcher: T, maxDepth: number = 5) {
    try {
      // @ts-ignore
      const singletons = Object.entries < any > (this.wGame.window.singletons.c)
      .map(([key, value]) => [key, value.exports])
      .filter(([key, value]) => this._isTargetWorthBrowsing(value, key));

      if (!singletons.length) return;

      const results = Array.prototype
        .concat(
          [],
          ...singletons.map(([key, value]) =>
            this._recursiveSearch(
              value,
              new RegExp(`^${matcher}$`),
              `singletons(${key})`,
              [],
              maxDepth,
              0,
            ).map(() => value),
          ),
        )
        .filter((v, i, a) => a.indexOf(v) === i);

      if (results.length > 1){
        console.log(`More than one singleton found !:`+matcher);
      }
            
      return results;
    } catch (error) {
      
    }
  }

  /** Gets the Ankama payload added to a window object */
  public _getAnkamaPayload(target = this.wGame.window): [string, any][] {
    if (!target) return;
    // @ts-ignore
    return Object.entries(target)
      .filter(([key]) => !(key in window))
      .filter(([key]) => key !== 'singletons')
      .filter(([key, value]) => this._isTargetWorthBrowsing(value, key, []));
  }

  /**
   * Checks if an object is worth browsing.
   * (For instance, an HTML Element, a function or an already seen reference aren't worth)
   */
  public _isTargetWorthBrowsing(target: any, key: string, alreadySeenRefs: any[] = []) {
    return (
      !!target &&
      (!!target.length || !!Object.keys(target).length) &&
      typeof target === 'object' &&
      !alreadySeenRefs.includes(target) &&
      !(target instanceof Element) &&
      !['self', '_parent'].includes(key) &&
      !['rootElement'].includes(key)
    );
  }

  /**
   * Checks if a matcher can be matched against a value
   * @param matcher the search criteria. Either a string or a RegExp.
   * @param valueToCheck The value to apply the matcher to
   */
  public _matches(matcher: string | RegExp, valueToCheck: string): boolean {
    try {
      return (
        (!!valueToCheck.match(matcher) || valueToCheck.toLowerCase().includes(matcher.toString().toLowerCase()))
      );
    } catch (error) {
      return false
    }
  }

  /**
   * Recursively finds a matching key in the provided target and its children
   */
  public _recursiveSearch(
    target: any,
    matcher: string | RegExp,
    path: string,
    alreadySeenRefs: any[],
    maxDepth: number,
    currentDepth: number,
  ): string[] {
    const results = [];
    // tslint:disable-next-line: forin
    for (const key in target) {
      const value = target[key];
      const currentPath = `${path}.${key}`;

      if (this._matches(matcher, key)) results.push(currentPath);

      if (!this._isTargetWorthBrowsing(value, key, alreadySeenRefs)) continue;
      if (currentDepth >= maxDepth) continue;

      if (Array.isArray(value)) {
        value.forEach((subValue, index) =>
          results.push(
            ...this._recursiveSearch(
              subValue,
              matcher,
              `${path}.${key}[${index}]`,
              alreadySeenRefs,
              maxDepth,
              currentDepth + 1,
            ),
          ),
        );
      } else {
        results.push(
          ...this._recursiveSearch(
            value,
            matcher,
            currentPath,
            alreadySeenRefs,
            maxDepth,
            currentDepth + 1,
          ),
        );
      }
    }
    alreadySeenRefs.push(target);
    return results;
  }
  public reset() {
    super.reset()
    Logger.info(' - finder deactiver')
  }
}