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
import { assign } from 'ndarray-ops';
import { cartesianProduct } from './utils.ts';
import { TilesetNotFound } from './error.ts';
import { isUndefined } from './domain/utils.ts';
import type { DataValue, RangeIndices, RangeOptions } from './types.ts';

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
		this.shape = this._shape(ndarr);
		this.options = options;

		this.totalSize = this._totalSize(this.shape);
		//@ts-expect-error (don't prefill because of redundant checks on get)
		this._ndarr = ndarray(new Array(this.totalSize), ndarr.shape);

		if (ndarr.type === 'TiledNdArray') this.tileSets = ndarr.tileSets;
		else this._appendRange(this.shape, Array(this.shape.length).fill(0), ndarr);
	}

	get values(): [T | null, ...(T | null)[]] {
		return this._ndarr.data;
	}
	_totalSize(shape: number[]): number {
		if (!shape.length) return 1;
		return shape.reduce((l, r) => l * r);
	}
	_shape(ndarr: Nd): number[] {
		if (ndarr.type === 'TiledNdArray') return ndarr.shape;
		if (ndarr.shape) return ndarr.shape;
		return [ndarr.values.length];
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
	_normalizeNamedIndices(indices: Map<string, number>): number[] {
		if (!this.axisNames.length) return [0];
		return this.axisNames
			.map((name) => indices.get(name) ?? 0)
			.map((v, i) => {
				if (v < 0) v = 0;
				const shape = this.shape[i];
				if (v >= shape) v = shape - 1;
				indices.set([...this.axisNames][i], v); // Modify map so that data has correct indices
				return v;
			});
	}
	_nameNormalizedIndices(indices: number[]): Exclude<RangeIndices, number[]> {
		return new Map(this.axisNames.map((an, i) => [an, indices[i]]));
	}

	/**
	 * copies a ndarray into the master ndarray in place
	 * @param tile The tile indices of the range
	 */
	_appendRange(
		tileShape: TileSet['tileShape'],
		tile: number[],
		range: ValuesNdArray<T> | StringNdArray | NumberNdArray
	) {
		const offsets = tile.map((v, i) => v * this._fillNulls(tileShape)[i]);
		assign(
			this._ndarr.lo(...offsets).hi(...(range.shape || this.shape)),
			ndarray(range.values, range.shape)
		);
	}
	/**
	 * Get the tile which best matches the indices
	 */
	_getBestTile(tileSet: TileSet, indices: number[]): number[] {
		return indices.map((idx, i) => {
			const tileSize = this._fillNulls(tileSet.tileShape)[i];
			const tileIdx = Math.floor(idx / tileSize);
			const maxTileIdx = Math.ceil(this.shape[i] / tileSize) - 1;
			// guard: tile index can never exceed the number of tiles on this axis
			return Math.min(tileIdx, maxTileIdx);
		});
	}
	_fillNulls(tileShape: TileSet['tileShape']): number[] {
		return tileShape.map((v, i) => v ?? this.shape[i]);
	}
	/**
	 *
	 */
	_intersects(indices: number[]) {
		return this.tileSets!.filter(({ tileShape }) =>
			this._fillNulls(tileShape).every((v, i) => indices[i] < v)
		);
	}
	_tileSetEffort(tileSet: TileSet) {
		return this._fillNulls(tileSet.tileShape).reduce((l, r) => l * r);
	}
	async _loadTileSet(indices: number[]): Promise<void> {
		const [bestMatch] = this._intersects(indices).sort(
			(a, b) => this._tileSetEffort(a) - this._tileSetEffort(b)
		);
		if (!bestMatch) throw new TilesetNotFound(indices);
		const tiles: number[][] = this.options.eagerLoad
			? this._getTileCombos(bestMatch)
			: [this._getBestTile(bestMatch, indices)];
		const template = parseTemplate(bestMatch.urlTemplate);
		const urls = tiles
			.map((tile) => Object.fromEntries(this._nameNormalizedIndices(tile)))
			.map((d) => template.expand(d));
		const ranges = await Promise.all(urls.map((url) => load<ValuesNdArray<T>>(url)));
		ranges.forEach((range, i) => this._appendRange(bestMatch.tileShape, tiles[i], range));
	}

	_getTileCombos({ tileShape }: TileSet): number[][] {
		const uniqueCombos = this._fillNulls(tileShape)
			.map((shape, i) => Math.ceil(this.shape[i] / shape)) // Get max allowable length for axis
			.map((shape) => [...Array(shape).keys()]); // Generate an array of all possible indices for axis
		return cartesianProduct<number>(...uniqueCombos).map((combo) =>
			this.axisNames.map((_, i) => combo[i])
		);
	}
	async get(indices: RangeIndices, cb?: (range: Range) => void): Promise<T | null> {
		if (!Array.isArray(indices)) indices = this._normalizeNamedIndices(indices);
		let value = this._ndarr.get(...indices);
		if (isUndefined(value) && this.type === 'TiledNdArray') {
			await this._loadTileSet(indices);
			cb?.(this);
			value = this._ndarr.get(...indices);
		}
		return value;
	}

	toJSON(resolve = false): Nd {
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

export function isNdArray(doc: CoverageJSON.CoverageJSON): doc is NdArray {
	return doc.type === 'TiledNdArray' || doc.type === 'NdArray';
}
