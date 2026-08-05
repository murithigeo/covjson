import type {
	Domain,
	ReferenceSystemConnection,
	CoverageCollection as CovColl,
	Coverage as CRG,
	NdArray as Nd,
	Position
} from 'coveragejson';
import { Parameter, ParameterGroup } from './parameters.ts';
import { Coverage } from './coverage.ts';
import { Referencing, type UserReferencingOptions } from './referencing.ts';
import { Base } from './base.ts';
import type { FeatureCollection } from 'geojson';
import type { InferDomainClass } from './domain/types.d.ts';

export class CoverageCollection<T extends Domain = Domain> extends Base<CovColl<T>> {
	_reproject(): this {
		throw Error('Method not implemented.');
	}
	type: 'CoverageCollection';
	coverages: Coverage<T>[];
	#referencing?: ReferenceSystemConnection[] | undefined;
	domainType?: InferDomainClass<T>['domainType'];
	parameterGroups: ParameterGroup[];
	properties: Record<string, unknown>;
	constructor(
		doc: Omit<CovColl, 'coverages'> & {
			coverages: ((CRG<T> & { ranges: Record<string, Nd> }) | Coverage<T>)[];
		}
	) {
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
		this.type = type;
		this.domainType = domainType;

		// todo make this a set or copy to coverages
		this.parameterGroups = parameterGroups.map((e) => new ParameterGroup(e));
		this.#referencing = referencing;
		this.properties = properties;
		const parameters_ = new Map(
			Object.entries(parameters).map(([id, param]) => [id, new Parameter(param, id)])
		);
		this.coverages = coverages.map((cov) => {
			const cov_ = cov instanceof Coverage ? cov : new Coverage(cov);
			if (!cov_.domain.referencing && this.referencing) cov_.domain.referencing = this.referencing;
			// Ensure that each coverage has a copy of the parameters and parameterGroups
			parameters_.entries().forEach(([k, v]) => cov_.addParameter(k, v));
			this.parameterGroups.forEach((v) => cov_.addParameterGroup(v));
			return cov_;
		});
	}

	static async load<T extends Domain>(doc: CovColl<T | string>): Promise<CoverageCollection<T>> {
		const coverages = await Promise.all(doc.coverages.map((cov) => Coverage.resolve(cov)));
		return new CoverageCollection({
			...doc,
			coverages
		});
	}
	denormalize() {
		for (const coverage of this.coverages) {
			coverage.denormalize();
		}
		return this;
	}
	normalize() {
		for (const coverage of this.coverages) {
			coverage.normalize();
		}
	}
	reproject(referencing: Referencing, force: true): this;
	reproject(referencing: Referencing, force?: false): Promise<this>;
	reproject(referencing: UserReferencingOptions, force?: false): Promise<this>;
	reproject(
		referencing: Referencing | UserReferencingOptions,
		force?: boolean
	): this | Promise<this> {
		if (referencing instanceof Referencing && force) {
			this.coverages = this.coverages.map((cov) => {
				cov = cov.reproject(referencing, true);
				cov.domain.referencing = undefined; // No need to keep copies of the same thing
				return cov;
			});

			return this;
		}
		return Promise.all(this.coverages.map((cov) => cov.reproject(referencing))).then(
			(coverages) => {
				this.#referencing = coverages[0].referencing; // Get a copy from the first coverage;
				this.coverages = coverages.map((cov) => {
					cov.domain.referencing = undefined; // No need to keep copies of the same thing
					return cov;
				});

				return this;
			}
		);
	}

	// Add referencing memeber behavior
	toPlain(): CovColl<T> {
		return {
			type: this.type,
			domainType: this.domainType,
			coverages: this.coverages.map((cov) => cov.toPlain()),
			parameters: this.parameters
				.entries()
				.reduce((l, [id, param]) => ({ ...l, [id]: param.toPlain() }), {}),
			parameterGroups: this.parameterGroups.map((e) => e.toPlain()),
			referencing: this.referencing
		};
	}
	get featurecollection(): FeatureCollection<
		InferDomainClass<T>['geometry'],
		{ uuid: string; domainType: T['domainType'] }
	> {
		return {
			type: 'FeatureCollection',
			features: this.coverages.map((cov) => cov.feature)
		};
	}
	public get referencing() {
		return this.#referencing;
	}
	get z(): number[] {
		return Array.from(new Set(this.coverages.flatMap(({ domain }) => domain.z))).sort();
	}
	get t(): string[] {
		const values = this.coverages
			.flatMap(({ domain }) => domain.t)
			.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
		return Array.from(new Set(values));
	}
	private set referencing(referencing: ReferenceSystemConnection[] | undefined) {
		this.#referencing = referencing;
	}

	async getData(point: Position, rangeIds: string[]) {
		rangeIds = rangeIds.map((id) => id.toUpperCase());
		return await Promise.all(this.coverages.map((coverage) => coverage.getData(point, rangeIds)));
	}
	/**
	 * Recompile list of parameters from constituent coverages
	 * If the parameter is referenced by more than 1 coverage, it is deleted from all coverages
	 */
	get parameters(): Map<string, Parameter> {
		const params = new Map(this.coverages.flatMap((c) => [...c.parameters]));
		const isNull = (v: any): v is null => v === null;
		for (const coverage of this.coverages) {
			for (let [id, range] of coverage.ranges) {
				const param = params.get(id);
				if (!param) continue;
				let { count = 0, minMax } = param.stats;
				count += 1;
				let _minMax = range.minMax;
				if (range.dataType !== 'string') {
					minMax = minMax || [null, null];
					_minMax = _minMax || [null, null];
					minMax.forEach((v0, i, arr) => {
						const v1 = _minMax![i];
						if (isNull(v0) && !isNull(v1)) v0 = v1;
						if (isNull(v0) && isNull(v1)) return;
						if (i === 0 && v1! < v0!) v0 = v1;
						if (i === 1 && v1! > v0!) v0 = v1;
						arr[i] = v0;
					});
				}
				param.stats.count = count;
				param.stats.minMax = minMax;
				params.set(id, param);
			}
		}
		return params;
	}
}
