import type { Coverage as CRG, Domain, NdArray, Position } from 'coveragejson';
import { Base, type ReferenceArgument } from './base.ts';
import { Parameter, ParameterGroup } from './parameters.ts';
import { BaseDomain, getDomain, isUndefined } from './domain/index.ts';
import { load } from './load.ts';
import type { InferDomainClass } from './domain/types.d.ts';
import { Referencing } from './referencing.ts';
import { Range, type RangeOptions } from './ranges.ts';
import { nanoid } from 'nanoid';
import { cartesianProduct } from './utils.ts';
import type { Feature } from 'geojson';
import type { CoverageProperties, GetDataOptions, QueryOptions } from './types.d.ts';

/**
 * Add a function to forcibly set each ranges minMax externally
 */
export interface CoverageOptions {
	/**
	 * Options to be applied to each ndarray
	 */
	ranges?: RangeOptions;
	/**
	 * The preferred language of any parameters
	 * @see {I18N} for more details
	 */
	language?: string;
}
export class Coverage<D extends Domain = Domain> extends Base<CRG<D>> {
	/**
	 * Remote NdArrays.
	 * Resolved when their keys are first fetched
	 */
	_ranges: Map<string, string>;
	get t() {
		return this.domain.t;
	}
	get z(): number[] {
		return this.domain.z;
	}
	type: 'Coverage';
	id?: string | undefined;
	domain: InferDomainClass<D>;
	properties: Record<string, unknown>;
	domainType: (typeof this.domain)['domainType'];
	parameters: Map<string, Parameter>;
	parameterGroups: ParameterGroup[];
	ranges: Map<string, Range>;
	uuid: string;
	indices: Map<string, number>;
	options: CoverageOptions;
	constructor(coverage: CRG<D | InferDomainClass<D>>, options: CoverageOptions = {}) {
		super();
		const {
			type,
			domain,
			domainType,
			ranges,
			parameterGroups = [],
			parameters = {},
			id,
			...properties
		} = coverage;
		this.type = type;
		this.id = id;
		this.domain = domain instanceof BaseDomain ? domain : getDomain<D>(domain);
		this.domainType = this.domain.domainType || domainType;

		this.ranges = new Map();
		this._ranges = new Map();
		for (let id in ranges) {
			const value = ranges[id];
			id = id.toUpperCase();
			if (typeof value === 'string') this._ranges.set(id, value);
			else this.ranges.set(id, new Range(value, options.ranges));
		}
		this.parameters = new Map();
		for (const id in parameters)
			this.parameters.set(id.toUpperCase(), new Parameter(parameters[id], id.toUpperCase()));

		this.parameterGroups = parameterGroups.map((e) => new ParameterGroup(e));
		this.properties = properties;
		this.uuid = nanoid();
		this.indices = new Map(Object.keys(this.domain.axes).map((k) => [k, 0]));
		this.options = options;
	}

	static async resolve<T extends Domain>(coverage: CRG<T | string>): Promise<CRG<T>> {
		if (typeof coverage.domain === 'string') coverage.domain = await load<T>(coverage.domain);
		coverage.domain.domainType = coverage.domain.domainType || coverage?.domainType;

		const ranges: Record<string, NdArray> = {};
		for (const id in coverage.ranges) {
			let range = coverage.ranges[id];
			if (typeof range === 'string') range = await load<NdArray>(range);
			ranges[id] = range;
		}
		let domain: T;
		if (typeof coverage.domain === 'string') domain = await load<T>(coverage.domain);
		else domain = coverage.domain;

		return {
			...coverage,
			//@ts-expect-error error in types upstream
			domainType: domain.domainType,
			domain,
			ranges
		};
	}
	static async load<T extends Domain = Domain>(
		coverage: CRG<T | string> | string,
		options?: CoverageOptions
	): Promise<Coverage<T>> {
		if (typeof coverage === 'string') coverage = await load<CRG<T>>(coverage);

		return Coverage.resolve<T>(coverage).then((cov) => new Coverage(cov, options));
	}

	/**
	 * Assumes that the domain contained has implemented the method
	 */
	denormalize(): Omit<this, 'domain'> & {
		domain: ReturnType<InferDomainClass<D>['denormalize']>;
	} {
		this.domain.denormalize();
		//@ts-expect-error
		return this;
	}

	normalize(): this {
		this.domain.normalize?.();
		return this;
	}

	get feature(): Feature<
		InferDomainClass<D>['geometry'],
		CoverageProperties<InferDomainClass<D>['domainType']>
	> {
		return {
			type: 'Feature',
			geometry: this.domain.geometry,
			properties: {
				...this.properties,
				id: this.id,
				uuid: this.uuid,
				domainType: this.domainType, // Allow filtering for maplibregl
				parameters: [...this.ranges.keys()]
			}
		};
	}

	/**
	 * Return a dictionary of axes which intersect with POI, elevation or time
	 */
	queryIndices(ref: Position | string | number) {
		const indices: Map<string, number> = this.domain.queryIndices(ref);
		for (const [axisName, index] of indices) {
			if (!this.axesSize.has(axisName)) indices.delete(axisName);
			if (index < 0) indices.set(axisName, 0);
		}
		return indices;
	}
	/**
	 * Calculates the indices given a reference dimension and overwrites @see {indices}.
	 * Is used in the maplibre and leaflet extensions
	 */
	calculateIndices(ref: Position | string | number): this {
		this.indices = this.queryIndices(ref);
		return this;
	}
	clone(reuseUuid = false): this {
		const val = super.clone();
		if (reuseUuid) {
			val.uuid = this.uuid;
			val.indices = this.indices;
		}
		return val;
	}
	/**
	 * @todo add explicit types that it returns {ranges:Record<string,NdArray>}
	 */
	toPlain(): CRG<D> {
		//@ts-expect-error domainType conflict upstream
		return structuredClone({
			type: this.type,
			domain: this.domain.toPlain(),
			ranges: this.ranges
				.entries()
				.reduce((l, [k, v]) => ({ ...l, [k]: typeof v === 'string' ? v : v.toPlain() }), {}),
			domainType: this.domain.domainType,
			parameters: this.parameters
				.entries()
				.reduce((l, r) => ({ ...l, [r[0]]: r[1].toPlain() }), {}),
			parameterGroups: this.parameterGroups.map((v) => v.toPlain())
		});
	}
	_reproject(referencing: Referencing): this {
		this.domain._reproject(referencing);
		return this;
	}
	/**
	 * Returns the domain's referencing property
	 */
	get referencing() {
		return this.domain.referencing;
	}
	/**
	 *
	 * @param ref The reference to get data for
	 * @param rangeIds The parameter IDs to get data for. Should be in uppercase
	 */
	async getData(ref: ReferenceArgument, options: GetDataOptions = {}): Promise<DataRow> {
		if (!ref) ref = this.indices;
		if (!(ref instanceof Map)) ref = this.queryIndices(ref);
		options.ranges = options.ranges || [...this.ranges.keys()];

		const values = options.ranges
			.map((id) => id.toUpperCase())
			.filter((id) => this.ranges.has(id) || this._ranges.has(id))
			.map(async (id) => {
				let range = this.ranges.get(id);
				if (!range) {
					range = await load<NdArray>(this._ranges.get(id)!).then(
						(obj) => new Range(obj, this.options.ranges)
					);
					this.ranges.set(id, range!);
					this._ranges.delete(id);
				}
				return [id, await (range as Range).get(ref, (range) => options?.cb?.(id, range))] as const;
			});

		const row: DataRow = Object.fromEntries(await Promise.all(values));

		return { ...row, ...Object.fromEntries(ref) };
	}

	/**
	 * Sorted in row-major order
	 */
	get axesSize(): Map<string, number> {
		const sorted = this.domain.axesSize
			.entries()
			.toArray()
			.sort(([, a], [, b]) => b - a);
		return new Map(sorted);
	}

	/**
	 *
	 * @param ref The reference. Can be a Map of computed indices or a Position
	 * @returns
	 */
	query(ref: ReferenceArgument, options: QueryOptions): Promise<DataRow[]> {
		options.axisNames = options.axisNames || {};
		const consider = this.axesSize
			.entries()
			.filter(([, count]) => !!count)
			.filter(([axisName]) => options.axisNames!?.[axisName]) // If false, this will get filtered out
			.map(([axisName, count]): [string, number[]] => {
				let values = options.axisNames![axisName];
				if (!Array.isArray(values)) {
					if (typeof values === 'boolean') values = { start: 0, stop: count };
					else if (!isUndefined(values.stop)) values.stop = values.stop + 1;
					values = [...Array(count).keys()].slice(values.start, values.stop);
				}

				return [axisName, values] as const;
			})
			.toArray();
		const axisIndices = consider.map(([, indices]) => [...indices]);
		const prod = cartesianProduct<number>(...axisIndices).map(
			(combo) => new Map(combo.map((idx, i) => [consider[i][0], idx]))
		);

		if (!(ref instanceof Map)) ref = this.queryIndices(ref);
		const rows = prod
			.map((indices) => new Map([...ref, ...indices]))
			.map((indices) => this.getData(indices, options));
		return Promise.all(rows);
	}
}

export type DataValue = string | number | null;
export type DataRow<T extends DataValue = DataValue> = Record<string, T | null> & {
	t?: number;
	z?: number;
	x?: number;
	y?: number;
	composite?: number;
};
