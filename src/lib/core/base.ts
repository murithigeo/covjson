import { Referencing, type ReferencingOptions } from './referencing.ts';
import type { ReferenceSystemConnection } from 'coveragejson';
import type { Indices } from './types';
import type { BBox } from 'geojson';
import { bboxToPolygon } from './utils.ts';

export abstract class Base<T> {
	abstract referencing: Referencing | undefined;

	async reproject(referencing: Referencing | ReferenceSystemConnection[] | ReferencingOptions) {
		const ref = await new Referencing(this.referencing).to(referencing);
		this._reproject(ref);

		this.referencing = ref;
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
	 * Given that it may use structuredClone under the hood, this will not work with Proxy objects
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

	/**
	 * Get a smaller view of the object
	 */
	subset(
		constraints: BBox | Record<string, Indices>
	): Promise<this | undefined> | this | undefined {
		if (Array.isArray(constraints)) {
			constraints = this._constraintsFromBbox(bboxToPolygon(constraints));
		}
		return this._applySubset(this._parseConstraints(constraints));
	}

	// Add subset by time

	/**
	 *
	 * @param constraints An object specifying which axis indices to load
	 * Note that the elements in the return must be unique
	 */
	abstract _parseConstraints(constraints: Record<string, Indices>): Map<string, Set<number>>;
	abstract _constraintsFromBbox({
		polygon,
		z
	}: ReturnType<typeof bboxToPolygon>): Record<string, Indices>;
	abstract _applySubset(
		constraints: Map<string, Set<number>>
	): Promise<this | undefined> | this | undefined;
}
