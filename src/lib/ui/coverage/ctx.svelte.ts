import {
	type Coverage,
	type DataRow,
	CustomDate,
	type RangeStatistics,
	isUndefined,
	isNull,
	type AxisNamesOptions,
	axisOptionsToList,
	type DenormalizedCoverage,
	type OnIndicesChange
} from '#lib/core/index.ts';
import { createContext, onDestroy } from 'svelte';
import type { ChartDimensions, Axis } from './types';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { DomainType } from 'layerchart';

export class CoverageContext {
	selected = $state.raw(new SvelteSet<string>());
	coverage = $state<DenormalizedCoverage>();
	/**
	 * Reactive indices
	 */
	indices = $derived(this.coverage?.indices);
	onIndicesChange = $state<OnIndicesChange>();
	cache = $state<DataRow[]>([]);
	config = $state(new SvelteMap<ChartDimensions, Axis>());
	data = $derived.by(() => {
		const ignore = this.config.values().toArray(); // index fields kept in full
		const check = this.axesSize
			.keys()
			.filter((an) => !ignore.includes(an))
			.toArray();
		return this.cache.filter((d) => check.every((an) => d[an] === (this.indices?.get(an) ?? 0)));
	});
	stats = $state(new SvelteMap<string, RangeStatistics>());
	tabValue = $state<'table' | 'chart'>('chart');
	tooltip = $state<DataRow[]>([]);
	//@ts-expect-error type conflict Axis/string
	axesSize = $derived(new SvelteMap<Axis, number>(this.coverage?.axesSize));

	/**
	 * The current primary tab value
	 */
	active = $state<string>('');

	axisNames = $state(new SvelteMap<Axis, AxisNamesOptions>());
	rangeIds = $derived(this.coverage?.rangeIds || []);

	constructor(coverage: DenormalizedCoverage) {
		this.coverage = coverage;
		coverage.rangeIds.forEach((k, i) => {
			if (!i) this.active = k;
			this.selected.add(k);
		});
		this.initialChartDims(coverage);
		$effect(() => {
			coverage
				.query(coverage.indices, {
					axisNames: Object.fromEntries(this.axisNames),
					ranges: [...this.selected].filter((k) => this.rangeIds.includes(k))
				})
				.then((rows) => this.updateData(rows));
		});
		onDestroy(() => {
			this.coverage = undefined;
			this.active = '';
			this.tooltip = [];
			this.cache = [];
			this.axisNames.clear();
			this.config.clear();
			this.selected.clear();
			this.stats.clear();
		});
	}

	resolve(an: Axis, idx: number, mode?: 'chart') {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const axis: undefined | any =
			this.coverage?.domain.axes[an as keyof (typeof this.coverage.domain)['axes']];
		if (!axis) return '';
		let dataType = axis.dataType || 'primitive';
		let value = axis.values[idx];

		if (dataType === 'tuple') {
			if (typeof value[0] === 'string' && mode === 'chart')
				[dataType, value] = ['primitive', value[0]];
		}
		if (dataType === 'primitive') {
			if (typeof value === 'string' && mode === 'chart') return new CustomDate(value);
			return value;
		}
		if (mode === 'chart') {
			if (dataType === 'polygon') return `polygon @ index: ${idx}`;
			return `(${value.join(',')})`;
		}

		return JSON.stringify(value, null, 2);
	}
	updateData(rows: DataRow[]): void {
		for (const row of rows) {
			let idx = this.cache.findIndex((d) =>
				this.axesSize.keys().every((k) => d[k] === (row[k] ?? 0))
			);
			if (idx < 0) idx = this.cache.length;
			const record =
				this.cache[idx] || Object.fromEntries(this.axesSize.keys().map((k) => [k, row[k] ?? 0]));
			for (const id of this.rangeIds) {
				if (!isUndefined(record[id])) continue;
				const value = row[id];
				const parameter = this.coverage?.parameters.get(id);
				if (parameter?.categoryEncoding) {
					record[id + ':cat'] = isNull(value) ? '' : (parameter?.getCategory(value)?.id ?? '');
				}
				record[id] = value;
			}
			this.cache[idx] = record;
		}
	}
	updateParamCheck(param: string) {
		return (checked: boolean) => {
			if (checked) this.selected.add(param);
			else this.selected.delete(param);
		};
	}
	initialChartDims(coverage: Coverage): void {
		const domain = coverage.domain;
		const loadAll = (...axes: Axis[]) => axes.forEach((axis) => this.axisNames.set(axis, true));
		switch (domain.domainType) {
			case 'Grid':
				this.setDimension('x', domain.t.length ? 't' : 'z').setDimension(
					'series',
					domain.t.length ? 'z' : 't'
				);
				loadAll('z', 't');
				break;
			case 'Section':
				this.setDimension('x', 'z').setDimension('series', 'composite');
				loadAll('z', 'composite');
				break;
			case 'Trajectory':
				this.setDimension('x', 'composite').setDimension('series', 'z');
				loadAll('composite', 'z');
				break;
			case 'VerticalProfile':
				this.setDimension('x', 'z');
				loadAll('z');
				break;
			case 'MultiPolygonSeries':
			case 'PolygonSeries':
			case 'MultiPointSeries':
			case 'PointSeries':
				this.setDimension('x', 't');
				if (domain.domainType !== 'PointSeries') this.setDimension('series', 'composite');
				loadAll('t', 'composite');
				break;
			case 'MultiPolygon':
			case 'Polygon':
				this.setDimension('x', domain.t.length ? 't' : domain.z.length ? 'z' : 'composite');
				loadAll('t', 'composite');
				break;
			case 'Point':
				this.setDimension('x', domain.t.length ? 't' : 'z');
				loadAll('z', 't');
				break;
			case 'MultiPoint':
				this.setDimension('x', domain.t.length ? 't' : 'composite');
				loadAll('t', 'composite');
		}
	}
	computeChartAxisDomain(dim?: ChartDimensions): DomainType {
		if (!dim) return undefined;
		const axis = this.config.get(dim);
		if (!axis) return undefined;
		const size = this.axesSize.get(axis);
		return axisOptionsToList(size, this.axisNames.get(axis)).map((i) =>
			this.resolve(axis, i, 'chart')
		);
	}
	setProp<K extends keyof this, V extends this[K]>(k: K, v: V) {
		this[k] = v;
	}
	setDimension(dim: ChartDimensions, axis: Axis): this {
		const size = this.axesSize.get(axis);
		if (!size) return this;
		this.config.set(dim, axis);
		return this;
	}
}

export const [getCovContext, setCovContext] = createContext<CoverageContext>();

export function makeIndicesReactive(cov: Coverage) {
	cov.indices = new SvelteMap(cov.indices);
}

class Box {
	value = $state(new SvelteMap<string, number>());
	constructor(value: Map<string, number>) {
		value.forEach((v, k) => value.set(k, v));
	}
}

export function makeCoverageIndicesReactive(cov: Coverage) {
	const indices = new Box(cov.indices);
	Object.defineProperty(cov, 'indices', {
		get: () => indices.value,
		set: (v) => {
			indices.value = v;
		},
		configurable: true,
		enumerable: true
	});
	return cov;
}
