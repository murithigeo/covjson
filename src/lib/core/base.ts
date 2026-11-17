import { Referencing, type ReferencingOptions } from './referencing.js';
import type { ReferenceSystemConnection } from 'coveragejson';

export abstract class Base<T> {
	abstract referencing: Referencing | undefined;

	async reproject(referencing: Referencing | ReferenceSystemConnection[] | ReferencingOptions) {
		const ref = await new Referencing(this.referencing).to(referencing);
		this._reproject(ref);
		if (Object.getOwnPropertyDescriptor(this, 'referencing')?.value) this.referencing = ref;

		return this;
	}

	/**
	 * If you extend this class to reproject the domain, remember to overwrite the "referencing" property using the "connections" Referencing member to ensure that coordinates do not lose their anchors
	 */
	abstract _reproject(referencing: Referencing): this | Promise<this>;

	/**
	 * Copies the arguments used to instantiate the class
	 * For most cases, this maybe used to return a "clean" Domain,Coverage,CoverageCollection
	 */
	abstract toJSON(referencing?: boolean): T;

	/**
	 * Returns a new instance of this class using return of the toJSON method
	 * Useful for when you want a "unique" object especially when getting objects in different reprojections
	 */
	clone(): this {
		const Ctor = this.constructor as new (args: T) => this;
		return new Ctor(this.toJSON());
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
