import { Referencing, type UserReferencingOptions as RefOptions } from './referencing.ts';
import type { ReferenceSystemConnection as RSC } from 'coveragejson';

export abstract class Base<T> {
  abstract get referencing(): RSC[] | undefined;
  /**
   *
   * @param referencing The Referencing instance or the output options
   * @param force If true, override the domain's referencing property
   */
  reproject(referencing: Referencing, force: true): this;
  reproject(referencing: Referencing | RefOptions, force?: false): Promise<this>;
  reproject(referencing: Referencing | RefOptions, force?: boolean) {
    if (referencing instanceof Referencing && force) {
      return this._reproject(referencing);
    }
    return Referencing.load(referencing, this.referencing).then((referencing) => {
      return this._reproject(referencing);
    });
  }

  /**
   * If you extend this class to reproject the domain, remember to overwrite the "referencing" property using the "connections" Referencing member to ensure that coordinates do not lose their anchors
   */
  abstract _reproject(referencing: Referencing): this;

  /**
   * Copies the arguments used to instantiate the class
   * For most cases, this maybe used to return a "clean" Domain,Coverage,CoverageCollection
   */
  abstract toPlain(referencing?: boolean): T;

  /**
   * Returns a new instance of this class using return of the toPlain method
   * Useful for when you want a "unique" object especially when getting objects in different reprojections
   */
  clone(): this {
    const Ctor = this.constructor as new (args: T) => this;
    return new Ctor(this.toPlain());
  }
  /**
   * Get temporal (t) values within the object
   */
  abstract get t(): string[];
  /**
   * Get elevation (z) values within the object
   */
  abstract get z(): number[];
}
