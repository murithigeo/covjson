import type {
	Domain,
	ReferenceSystemConnection,
	CoverageCollection as CovColl,
	Coverage as CRG,
	ReferenceSystemObject
} from 'coveragejson';
import { Parameter, ParameterGroup } from './parameters.ts';
import { Coverage, type CoverageOptions } from './coverage.ts';
import { Referencing, type UserReferencingOptions } from './referencing.ts';
import { Base, type MapIndices, type ReferenceArgument } from './base.ts';
import type { FeatureCollection } from 'geojson';
import type { InferDomainClass } from './domain/types.d.ts';
import { type WithRequiredProperty } from './utils.ts';
import type { CoverageProperties, GetDataOptions, QueryOptions } from './types';

export class CoverageCollection<
	D extends Domain = Domain,
	ID extends InferDomainClass<D> = InferDomainClass<D>
> extends Base<CovColl<D>> {
	type: 'CoverageCollection';
	coverages: Coverage<D>[];
	domainType?: D['domainType'];
	referencing: ReferenceSystemConnection<ReferenceSystemObject>[] | undefined;
	parameters: Map<string, Parameter>;
	parameterGroups: ParameterGroup[];
	properties: Record<string, unknown>;
	options: WithRequiredProperty<CoverageOptions, 'ranges'>;
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
		this.referencing = referencing;
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
	reproject(referencing: Referencing, force: true): this;
	reproject(referencing: Referencing, force?: false): Promise<this>;
	reproject(referencing: UserReferencingOptions, force?: false): Promise<this>;
	reproject(
		referencing: Referencing | UserReferencingOptions,
		force?: boolean
	): this | Promise<this> {
		if (referencing instanceof Referencing && force) {
			this._reproject(referencing);
			this.coverages = this.coverages
				.map((cov) => cov.reproject(referencing, true))
				.map((cov) => {
					delete cov.domain.referencing;
					return cov;
				});

			return this;
		}

		return Promise.all(this.coverages.map((cov) => cov.reproject(referencing))).then((covs) => {
			this.coverages = covs.map((cov, i) => {
				if (i === 0 && cov.domain.referencing) this.referencing = [...cov.domain.referencing];
				delete cov.domain.referencing;
				return cov;
			});

			return this;
		});
	}

	_reproject(referencing: Referencing): this {
		this.referencing = referencing.connections;
		return this;
	}
	// Add referencing memeber behavior
	toPlain(): CovColl<D> {
		return {
			type: this.type,
			//@ts-expect-error upstream conflict
			domainType: this.domainType,
			coverages: this.coverages.map((cov) => cov.toPlain()),
			parameters: this.parameters
				.entries()
				.reduce((l, [id, param]) => ({ ...l, [id]: param.toPlain() }), {}),
			parameterGroups: this.parameterGroups.map((e) => e.toPlain()),
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
	async getData(ref: Exclude<ReferenceArgument, MapIndices>, options?: GetDataOptions) {
		const data = await Promise.all(this.coverages.map((cov) => cov.getData(ref, options)));

		return data;
	}
	/**
	 * @param axisNames Axis names to preload data for
	 */
	query(ref: Exclude<ReferenceArgument, MapIndices>, options: QueryOptions) {
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
