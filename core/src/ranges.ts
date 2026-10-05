import type {
  TileSet,
  ValuesNdArray,
  TiledNdArray,
  NumberNdArray,
  StringNdArray,
  NdArray
} from 'coveragejson';
import ndarray, { type Data, type NdArray as NdArr } from 'ndarray';
import { parseTemplate } from 'url-template';
import { load } from './load.ts';
import ops from 'ndarray-ops';
import { cartesianProduct, minMax } from './utils.ts';
import { TilesetNotFound } from './error.ts';
import { calculateMedian, isUndefined } from './domain/utils.ts';
import type { MapIndices } from './base.ts';
import type { PartialBy } from '../../ui/dist/dashboards/utils/types.js';

export interface RangeOptions<T extends DataValue = DataValue> {
  /**
   * Transforms all values of the ndarray.
   * Convenient for converting values between various formats
   * Only called once per value
   */
  transform?: (val: T | null, dataType: 'string' | 'float' | 'integer') => T | null;
  /**
   * Callback to execute if the value fetched was not cached thus meaning new data was appended
   */
  onNonCacheFetch?(value: Range<T>): void;
  /**
   * When a indices hit requests that tileSet, the entire tileSet is loaded
   */
  eagerLoad?: boolean;
}

type DataValue = string | number;

export class Range<
  T extends DataValue = DataValue,
  Nd extends NdArray = NdArray
> implements RangeStatistics {
  dataType: 'string' | 'float' | 'integer';
  type: Nd['type'];
  shape: number[];
  axisNames: string[];
  totalSize: number;
  _ndarr: NdArr<[T | null, ...(T | null)[]]>;
  min: number | null;
  max: number | null;
  mean: number | null;
  median: T | null;
  options: RangeOptions<T>;
  tileSets?: TiledNdArray['tileSets'];
  _tileSets?: TileSetWoNulls[];
  constructor(ndarr: Nd, options: RangeOptions<T> = {}) {
    this.dataType = ndarr.dataType;
    this.axisNames = ndarr.axisNames || [];
    this.type = ndarr.type;
    this.shape = ndarr.shape || [1];
    this.max = null;
    this.min = null;
    this.median = null;
    this.mean = null;
    this.options = options;

    this.totalSize = this.computeTotalSize(this.shape);
    this._ndarr = ndarray(new Array(this.totalSize), ndarr.shape);
    if (ndarr.type === 'TiledNdArray') {
      this.tileSets = ndarr.tileSets;
      this._tileSets = ndarr.tileSets.map(({ tileShape, urlTemplate }) => ({
        tileShape: tileShape.map((v, i) => v ?? ndarr.shape[i]),
        urlTemplate
      }));
    }

    if (ndarr.type === 'NdArray') {
      this.appendRange(this.shape, Array(this.shape.length).fill(0), ndarr);
      this.computeMean();
      this.computeMedian();
      this.computeMinMax(ndarr);
    }
  }

  get values(): [T | null, ...(T | null)[]] {
    return this._ndarr.data;
  }
  computeTotalSize(shape: number[]): number {
    if (!shape.length) return 1;
    if (shape.length === 1) return shape[0];
    return shape.reduce((l, r) => l * r, 0);
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
  normalizeNamedIndices(indices: MapIndices): number[] {
    if (!this.axisNames.length) return [0];
    return this.axisNames
      .map((name) => indices.get(name) || 0)
      .map((v, i) => (v < 0 ? 0 : v >= this.shape[i] ? this.shape[i] - 1 : v));
  }
  nameNormalizedIndices(indices: number[]): MapIndices {
    return new Map(indices.map((v, i) => [this.axisNames[i], v]));
  }

  /**
   * copies a ndarray into the master ndarray in place
   * @param tile The tile indices of the range
   */
  appendRange(
    tileShape: TileSet['tileShape'],
    tile: number[],
    range: ValuesNdArray<T> | StringNdArray | NumberNdArray
  ) {
    const offsets = tile.map((v, i) => v * (tileShape[i] ?? this.shape[i]));
    const { shape = this.shape, values } = range;
    ops.assign(this._ndarr.lo(...offsets).hi(...shape), ndarray(values, shape));
  }
  /**
   * Get the tile which best matches the indices
   */
  getBestTile(tileSet: TileSet, indices: number[]): number[] {
    return indices.map((idx, i) => {
      const tileSize = tileSet.tileShape[i] ?? this.shape[i];
      const tileIdx = Math.floor(idx / tileSize);
      const maxTileIdx = Math.ceil(this.shape[i] / tileSize) - 1;
      // guard: tile index can never exceed the number of tiles on this axis
      return Math.min(tileIdx, maxTileIdx);
    });
  }

  /**
   *
   */
  intersects(indices: number[]): TileSetWoNulls[] {
    return this._tileSets!.filter(({ tileShape }) => tileShape.every((v, i) => indices[i] <= v));
  }
  tileSetEffort(tileSet: TileSetWoNulls) {
    return tileSet.tileShape.reduce((l, r) => l * r);
  }
  async loadTileSet(indices: number[]): Promise<void> {
    const [bestMatch] = this.intersects(indices).sort(
      (a, b) => this.tileSetEffort(a) - this.tileSetEffort(b)
    );
    if (!bestMatch) throw new TilesetNotFound(indices);
    const tiles = this.options.eagerLoad
      ? this.getTileCombos(bestMatch)
      : [this.getBestTile(bestMatch, indices)];
    const template = parseTemplate(bestMatch.urlTemplate);
    const urls = tiles
      .map((tile) => Object.fromEntries(this.nameNormalizedIndices(tile)))
      .map((d) => template.expand(d));
    const ranges = await Promise.all(urls.map((url) => load<ValuesNdArray<T>>(url)));
    ranges.forEach((range, i) => {
      if (this.options.transform) {
        for (let i = 0; i < range.values.length; i++) {
          range.values[i] = this.options.transform(range.values[i], this.dataType);
        }
      }
      this.appendRange(bestMatch.tileShape, tiles[i], range);
      this.computeMean();
      this.computeMedian();
      this.computeMinMax(range);
    });
  }

  getTileCombos({ tileShape }: TileSetWoNulls): number[][] {
    const uniqueCombos = tileShape
      .map((shape, i) => shape ?? this.shape[i]) //Get non-null max value for axis
      .map((shape, i) => Math.ceil(this.shape[i] / shape)) // Get max allowable length for axis
      .map((shape) => [...Array(shape).keys()]); // Generate an array of all possible indices for axis
    return cartesianProduct<number>(...uniqueCombos).map((combo) =>
      this.axisNames.map((_, i) => combo[i])
    );
  }
  async get(indices: MapIndices | number[]): Promise<T | null> {
    if (!Array.isArray(indices)) indices = this.normalizeNamedIndices(indices);
    let value = this._ndarr.get(...indices);
    if (this.type === 'NdArray') return value;
    if (isUndefined(value)) return value;
    return this.loadTileSet(indices).then(() => {
      this.options?.onNonCacheFetch?.(this);
      return this._ndarr.get(...indices);
    });
    // Dont recurse to avoid infinite looping
  }

  /**
   * Use a new range to reduce going through all values again
   */
  computeMinMax(range: StringNdArray | NumberNdArray | ValuesNdArray<T>): void {
    if (this.dataType === 'string') return;
    [this.min, this.max] = minMax([...(range.values as number[]), this.min, this.max]);
  }

  computeMean() {
    if (this.dataType === 'string') return;
    const values = this._ndarr.data.filter((v) => typeof v === 'number');
    const total = values.reduce((l, r) => l + r, 0);
    this.mean = total / this.totalSize;
  }
  computeMedian() {
    this.median = calculateMedian(this.values);
  }
  toPlain(resolve = false): Nd {
    if (this.type === 'NdArray' || resolve) {
      return {
        type: 'NdArray',
        dataType: this.dataType,
        axisNames: this.axisNames,
        shape: this.shape,
        values: this.values
      } as ValuesNdArray<T>;
    }
    return {
      type: 'TiledNdArray',
      dataType: this.dataType,
      axisNames: this.axisNames,
      shape: this.shape,
      tileSets: this.tileSets
    } as TiledNdArray;
  }
}

type TileSetWoNulls = Omit<TileSet, 'tileShape'> & { tileShape: number[] };

interface RangeStatistics {
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
}
