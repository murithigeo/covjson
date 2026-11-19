import type { Domain, CoverageCollection as CovColl, Coverage as CRG } from 'coveragejson';
import { Parameter, ParameterGroup } from './parameters.js';
import { Coverage } from './coverage.js';
import { Referencing } from './referencing.js';
import { Base } from './base.js';
import type { FeatureCollection } from 'geojson';
import type { InferDomainClass } from './domain/types.js';
import type {
	CoverageOptions,
	CoverageProperties,
	GetDataOptions,
	QueryOptions,
	Reference
} from './types.js';

export class CoverageCollection<
	D extends Domain = Domain,
	ID extends InferDomainClass<D> = InferDomainClass<D>
> extends Base<CovColl<D>> {
	type: 'CoverageCollection';
	coverages: Coverage<D>[];
	domainType?: D['domainType'];
	referencing: Referencing;
	parameters: Map<string, Parameter>;
	parameterGroups: ParameterGroup[];
	properties: Record<string, unknown>;
	options: CoverageOptions;
	constructor(doc: CoverageCollectionArg<D>, options?: CoverageOptions) {
		super();
		const {
			type,
			domainType,
			coverages,
			referencing,
			parameterGroups = [],
			parameters = {},
			...properties
		} = doc;
		this.options = { ...options, ranges: options?.ranges || {} };
		this.type = type;
		this.domainType = domainType;
		this.parameterGroups = parameterGroups.map((e) => new ParameterGroup(e));
		this.referencing = new Referencing(referencing);
		this.properties = properties;
		this.parameters = new Map();
		for (const id in parameters) {
			this.parameters.set(id.toUpperCase(), new Parameter(parameters[id], id.toUpperCase()));
		}

		this.coverages = [];

		for (const coverage of coverages) {
			if (coverage instanceof Coverage) {
				this.coverages.push(coverage);
				this.parameters = new Map([...this.parameters, ...coverage.parameters]);
				if (!coverage.referencing) coverage.domain.referencing = this.referencing;
				continue;
			}
			Coverage.load(coverage, this.options).then((cov) => {
				this.parameters = new Map([...this.parameters, ...cov.parameters]);
				if (!cov.referencing) cov.domain.referencing = this.referencing;
				this.coverages.push(cov);
			});
		}
	}

	static async load<D extends Domain>(
		doc: CovColl<D | string>,
		options?: CoverageOptions
	): Promise<CoverageCollection<D>> {
		return new CoverageCollection<D>(
			{
				...doc,
				domainType: doc.domainType,
				coverages: await Promise.all(doc.coverages.map((cov) => Coverage.load(cov, options)))
			},
			options
		);
	}
	denormalize() {
		for (const coverage of this.coverages) coverage.denormalize();
		return this;
	}
	normalize() {
		for (const coverage of this.coverages) coverage.normalize();
	}

	async _reproject(referencing: Referencing): Promise<this> {
		this.referencing = referencing;
		for (let i = 0; i < this.coverages.length; i++) {
			this.coverages[i] = await this.coverages[i].reproject(referencing);
			delete this.coverages[i].domain.referencing;
		}
		return this;
	}
	// Add referencing memeber behavior
	toJSON(): CovColl<D> {
		return {
			type: this.type,
			//@ts-expect-error upstream conflict
			domainType: this.domainType,
			coverages: this.coverages.map((cov) => cov.toJSON()),
			parameters: this.parameters
				.entries()
				.reduce((l, [id, param]) => ({ ...l, [id]: param.toJSON() }), {}),
			parameterGroups: this.parameterGroups.map((e) => e.toJSON()),
			referencing: this.referencing
		};
	}
	get featurecollection(): FeatureCollection<ID['geometry'], CoverageProperties<ID['domainType']>> {
		return {
			type: 'FeatureCollection',
			features: this.coverages.map((cov) => cov.feature)
		};
	}

	get z(): number[] {
		return new Set(this.coverages.flatMap(({ domain }) => domain.z))
			.keys()
			.toArray()
			.sort((a, b) => a - b);
	}
	get t() {
		return new Set(this.coverages.flatMap((cov) => cov.t))
			.keys()
			.toArray()
			.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
	}

	/**
	 * Simple function to retrieve a list of data values.
	 * For eagerLoading data, see @see {query}
	 */
	async getData(ref: Reference, options?: GetDataOptions) {
		const data = await Promise.all(this.coverages.map((cov) => cov.getData(ref, options)));

		return data;
	}
	/**
	 * @param axisNames Axis names to preload data for
	 */
	query(ref: Reference, options: QueryOptions) {
		return this.coverages.map((cov) => cov.query(ref, options));
	}

	addCoverage(coverage: Coverage<D>) {
		this.parameters = new Map([...this.parameters, ...coverage.parameters]);
		this.coverages.push(coverage);
	}
}

export type CoverageCollectionArg<D extends Domain> = Omit<CovColl<D>, 'coverages'> & {
	coverages: Array<Coverage<D> | CRG<D>>;
};
