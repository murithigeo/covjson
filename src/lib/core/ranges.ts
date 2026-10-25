import type {
	TileSet,
	ValuesNdArray,
	TiledNdArray,
	NumberNdArray,
	StringNdArray,
	NdArray
} from 'coveragejson';
import ndarray, { type NdArray as NdArr } from 'ndarray';
import { parseTemplate } from 'url-template';
import { load } from './load.ts';
import ops from 'ndarray-ops';
import { cartesianProduct } from './utils.ts';
import { TilesetNotFound } from './error.ts';
import { isUndefined } from './domain/utils.ts';
import type { Indices } from './base.ts';

export interface RangeOptions {
	/**
	 * When a indices hit requests that tileSet, the entire tileSet is loaded
	 */
	eagerLoad?: boolean;
	categoryEncoding?: Map<string, number[]>;
}

type DataValue = string | number;

export class Range<T extends DataValue = DataValue, Nd extends NdArray = NdArray> {
	dataType: 'string' | 'float' | 'integer';
	type: 'NdArray' | 'TiledNdArray';
	shape: number[];
	axisNames: string[];
	totalSize: number;
	_ndarr: NdArr<[T | null, ...(T | null)[]]>;

	options: RangeOptions;
	tileSets?: TiledNdArray['tileSets'];
	constructor(ndarr: Nd, options: RangeOptions = {}) {
		this.dataType = ndarr.dataType;
		this.axisNames = ndarr.axisNames || [];
		this.type = ndarr.type;
		this.shape = ndarr.shape || [1];
		this.options = options;

		this.totalSize = this.computeTotalSize(this.shape);
		//@ts-expect-error (don't prefill because of redundant checks on get)
		this._ndarr = ndarray(new Array(this.totalSize), ndarr.shape);

		if (ndarr.type === 'TiledNdArray') this.tileSets = ndarr.tileSets;
		else this.appendRange(this.shape, Array(this.shape.length).fill(0), ndarr);
	}

	get values(): [T | null, ...(T | null)[]] {
		return this._ndarr.data;
	}
	computeTotalSize(shape: number[]): number {
		if (!shape.length) return 1;
		return shape.reduce((l, r) => l * r);
	}
	/**
	 *
	 * Convert named axis indices into a list array.
	 * If a element of the "shape" has no key in the argument, then a zero is initialized
	 * If the indices exceed the maximum corresponding value in the shape, they are "coerced back" into maximum
	 * @example
	 * const indices=new NdArr(...,axisNames:["t","x","y"]).reduceIndices({x:20,y:1})
	 * indices=[0,20,1]
	 */
	normalizeNamedIndices(indices: Map<string, number>): number[] {
		if (!this.axisNames.length) return [0];
		return this.axisNames
			.map((name) => indices.get(name) ?? 0)
			.map((v, i) => (v < 0 ? 0 : v >= this.shape[i] ? this.shape[i] - 1 : v));
	}
	nameNormalizedIndices(indices: number[]): Exclude<Indices, number[]> {
		return new Map(this.axisNames.map((an, i) => [an, indices[i]]));
	}

	/**
	 * copies a ndarray into the master ndarray in place
	 * @param tile The tile indices of the range
	 * Incorrect for appedni
	 */
	appendRange(
		tileShape: TileSet['tileShape'],
		tile: number[],
		range: ValuesNdArray<T> | StringNdArray | NumberNdArray
	) {
		const offsets = tile.map((v, i) => v * this.fillNulls(tileShape)[i]);

		ops.assign(
			this._ndarr.lo(...offsets).hi(...(range.shape || this.shape)),
			ndarray(range.values, range.shape)
		);
	}
	/**
	 * Get the tile which best matches the indices
	 */
	getBestTile(tileSet: TileSet, indices: number[]): number[] {
		return indices.map((idx, i) => {
			const tileSize = this.fillNulls(tileSet.tileShape)[i];
			const tileIdx = Math.floor(idx / tileSize);
			const maxTileIdx = Math.ceil(this.shape[i] / tileSize) - 1;
			// guard: tile index can never exceed the number of tiles on this axis
			return Math.min(tileIdx, maxTileIdx);
		});
	}
	fillNulls(tileShape: TileSet['tileShape']): number[] {
		return tileShape.map((v, i) => v ?? this.shape[i]);
	}
	/**
	 *
	 */
	intersects(indices: number[]) {
		return this.tileSets!.filter(({ tileShape }) =>
			this.fillNulls(tileShape).every((v, i) => indices[i] < v)
		);
	}
	tileSetEffort(tileSet: TileSet) {
		return this.fillNulls(tileSet.tileShape).reduce((l, r) => l * r);
	}
	async loadTileSet(indices: number[]): Promise<void> {
		const [bestMatch] = this.intersects(indices).sort(
			(a, b) => this.tileSetEffort(a) - this.tileSetEffort(b)
		);
		if (!bestMatch) throw new TilesetNotFound(indices);
		const tiles: number[][] = this.options.eagerLoad
			? this.getTileCombos(bestMatch)
			: [this.getBestTile(bestMatch, indices)];
		const template = parseTemplate(bestMatch.urlTemplate);
		const urls = tiles
			.map((tile) => Object.fromEntries(this.nameNormalizedIndices(tile)))
			.map((d) => template.expand(d));
		const ranges = await Promise.all(urls.map((url) => load<ValuesNdArray<T>>(url)));
		ranges.forEach((range, i) => this.appendRange(bestMatch.tileShape, tiles[i], range));
	}

	getTileCombos({ tileShape }: TileSet): number[][] {
		const uniqueCombos = this.fillNulls(tileShape)
			.map((shape, i) => Math.ceil(this.shape[i] / shape)) // Get max allowable length for axis
			.map((shape) => [...Array(shape).keys()]); // Generate an array of all possible indices for axis
		return cartesianProduct<number>(...uniqueCombos).map((combo) =>
			this.axisNames.map((_, i) => combo[i])
		);
	}
	async get(indices: Indices, cb?: (range: Range) => void): Promise<T | null> {
		if (!Array.isArray(indices)) indices = this.normalizeNamedIndices(indices);
		let value = this._ndarr.get(...indices);
		if (isUndefined(value) && this.type === 'TiledNdArray') {
			await this.loadTileSet(indices);
			cb?.(this);
			value = this._ndarr.get(...indices);
		}
		return value;
	}

	toPlain(resolve = false): Nd {
		if (this.type === 'NdArray' || resolve) {
			//@ts-expect-error conflict
			return {
				type: 'NdArray',
				dataType: this.dataType,
				axisNames: this.axisNames,
				shape: this.shape,
				values: this.values
			} as ValuesNdArray<T>;
		}
		//@ts-expect-error conflict

		return {
			type: 'TiledNdArray',
			dataType: this.dataType,
			axisNames: this.axisNames,
			shape: this.shape,
			tileSets: this.tileSets
		} as TiledNdArray;
	}
}

export interface RangeStatistics {
	dataType?: 'string' | 'float' | 'integer';
	/**
	 * Defaults to null for string NdArrays
	 */
	min: number | null;
	/**
	 * Defaults to null for string NdArrays
	 */
	max: number | null;
	/**
	 * The middle value of the values
	 */
	median: string | number | null;
	/**
	 * The average of the NdArray
	 */
	mean: number | null;
	/**
	 * Provided a categoryEncoding object, calculate the bins
	 */
	frequency?: Map<string, number> | null;
}

export function isNdArray(doc: CoverageJSON.CoverageJSON): doc is NdArray {
	return doc.type === 'TiledNdArray' || doc.type === 'NdArray';
}
