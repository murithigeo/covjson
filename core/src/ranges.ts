import type {
  TileSet,
  ValuesNdArray,
  TiledNdArray,
  NumberNdArray,
  StringNdArray
} from 'coveragejson';
import ndarray, { type NdArray as NdArr } from 'ndarray';
import { parseTemplate } from 'url-template';
import { load } from './load.ts';
import ops from 'ndarray-ops';
import { cartesianProduct, minMax, type MinMax } from './utils.ts';
import { TilesetNotFound } from './error.ts';
import { isUndefined } from './domain/utils.ts';
import type { MapIndices } from './base.ts';

export interface NdArrayOptions<T extends string | number = string | number> {
  /**
   * When a indices hit requests that tileSet, the entire tileSet is loaded
   */
  eagerLoad?: boolean;
  /**
   * Transforms all values of the ndarray. Convinient for converting values between various formats
   * Only called once during loading
   * @example
   * const ndarrIn=new TiledNdArray(...)
   *
   */
  transform?: (val: T | null, dataType: 'string' | 'float' | 'integer') => T | null;
}

type NdArrX<T extends string | number> = NumberNdArray | StringNdArray | ValuesNdArray<T>;
export class NdArray<T extends string | number = string | number> {
  type: 'TiledNdArray' | 'NdArray';
  ndarr: NdArr<[T | null, ...(T | null)[]]>;
  #tileSets: TileSet[];
  shape: number[];
  axisNames: string[];
  dataType: ValuesNdArray<T>['dataType'];
  options: NdArrayOptions;
  minMax: MinMax;
  constructor(ndarr: NdArrX<T> | TiledNdArray, options?: NdArrayOptions) {
    this.type = ndarr.type;
    this.axisNames = ndarr.axisNames || [];
    this.shape = ndarr.shape || [1];
    this.ndarr = ndarray(new Array(this.totalSize) as [T | null, ...(T | null)[]], this.shape);
    this.#tileSets = 'tileSets' in ndarr ? ndarr.tileSets : [];
    this.dataType = ndarr.dataType as ValuesNdArray<T>['dataType'];
    this.options = options || {};
    this.minMax = [null, null];
    if ('values' in ndarr) this.appendRange(this.shape, Array(this.totalSize).fill(0), ndarr);
  }
  get totalSize() {
    if (this.shape.length === 0) return 1;
    return this.shape.reduce((l, r) => l * r);
  }

  /**
   * Get the ndarray's data.
   * If all the data has not been completely loaded, undefined values will become nulls
   * @todo fill nulls on init
   */
  get values(): [T | null, ...(T | null)[]] {
    for (let i = 0; i < this.totalSize; i++) {
      if (isUndefined(this.ndarr.data[i])) this.ndarr.data[i] = null;
    }
    return this.ndarr.data;
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
    if (!this.axisNames.length) return [0]; // For 0D ranges
    return this.axisNames
      .map((an) => indices.get(an) || 0)
      .map((v, i) => (v < 0 ? 0 : v >= this.shape[i] ? this.shape[i] - 1 : v)); // The shape[i] is the number of values so the max index=max-1
  }
  /**
   * @description Get the value of the range at these indices
   * For Simple NdArrays, this should be asynchronous
   * If the range is tiled and the value is undefined, then the matching tileset is loaded and the data fetched directly
   */

  async get<T extends string | number | null>(indices: MapIndices | number[]) {
    if (!Array.isArray(indices)) indices = this.normalizeNamedIndices(indices);
    const value = this.ndarr.get(...indices);
    if (value !== undefined) return value;
    await this.loadTileset(indices);
    return this.ndarr.get(...indices) as T; // Dont recurse to avoid infinite loops
  }

  /**
   * @todo Make this class generic so that some methods can be publicly available
   */
  get tileSets() {
    if (this.type === 'NdArray') return undefined;
    return this.#tileSets;
  }
  /***
   * Get the tileSets that contain the indices passed
   */
  intersects(indices: number[]) {
    return ({ tileShape }: TileSet) => {
      return tileShape.every((v, i) => {
        return indices[i] <= (v ?? this.shape[i]);
      });
    };
  }
  /**
   * Calculates the total length of the resolved ndarrays if the tileSet were loaded
   */
  tilesetEffort(tileSet: TileSet) {
    return this.fillNulls(tileSet.tileShape).reduce((l, r) => l * r);
  }

  fillNulls(tileShape: TileSet['tileShape']) {
    return tileShape.map((v, i) => v ?? this.shape[i]);
  }
  /**
   * Loads an ndarray into the master ndarray object
   * @todo implement a way to destroy the cache forcing the func to load new data
   */
  appendRange(tileShape: TileSet['tileShape'], tile: number[], range: NdArrX<T>) {
    const offsets = tile.map((v, i) => v * (tileShape[i] ?? this.shape[i]));
    const {
      shape = this.shape, // If range has no shape, then use the one it was init with (0D)
      values
    } = range;
    values.forEach((v, i, arr) => (arr[i] = this.options.transform?.(v, this.dataType) || v));
    ops.assign(this.ndarr.lo(...offsets).hi(...shape), ndarray(values, shape));
    this.updateMinMax();
  }
  /**
   * Gets the indices of the tile that contains the indices provided
   */
  getBestTile(tileSet: TileSet, indices: number[]): number[] {
    return indices.map((idx, i) => {
      const tileSize = tileSet.tileShape[i] ?? this.shape[i];
      const tileIndex = Math.floor(idx / tileSize);
      const maxTileIndex = Math.ceil(this.shape[i] / tileSize) - 1;
      // guard: tile index can never exceed the number of tiles on this axis
      return Math.min(tileIndex, maxTileIndex);
    });
  }

  async loadTileset(indices: number[]): Promise<void> {
    const [tileSet] = this.#tileSets
      .filter(this.intersects(indices))
      .sort((a, b) => this.tilesetEffort(a) - this.tilesetEffort(b));

    if (!tileSet) throw new TilesetNotFound(indices);
    const tiles: number[][] = this.options.eagerLoad
      ? this.getTileCombos(tileSet)
      : [this.getBestTile(tileSet, indices)];
    const template = parseTemplate(tileSet.urlTemplate);
    const urls = tiles.map((tile) =>
      template.expand(tile.reduce((l, r, i) => ({ ...l, [this.axisNames[i]]: r }), {}))
    );
    const ranges = await Promise.all(urls.map((href) => load<ValuesNdArray<T>>(href)));
    ranges.forEach((range, i) => this.appendRange(tileSet.tileShape, tiles[i], range));
  }
  /**
   * All possible combinations of a tileset's shape
   */
  getTileCombos({ tileShape }: TileSet) {
    const uniqueCombos = tileShape
      .map((shape, i) => shape ?? this.shape[i]) //Get non-null max value for axis
      .map((shape, i) => Math.ceil(this.shape[i] / shape)) // Get max allowable length for axis
      .map((shape) => [...Array(shape).keys()]); // Generate an array of all possible indices for axis
    return cartesianProduct<number>(...uniqueCombos).map((combo) =>
      this.axisNames.map((_, i) => combo[i])
    ); //
  }
  toPlain(nonTiled = false): ValuesNdArray<T> | TiledNdArray {
    if (this.type === 'NdArray' || nonTiled) {
      return {
        type: 'NdArray',
        dataType: this.dataType,
        shape: this.totalSize === 1 ? undefined : this.shape,
        axisNames: this.axisNames.length ? this.axisNames : undefined,
        values: this.values
      };
    }
    return {
      type: 'TiledNdArray',
      dataType: this.dataType,
      tileSets: this.tileSets as [TileSet, ...TileSet[]],
      shape: this.shape as [number, ...number[]],
      axisNames: this.axisNames
    };
  }
  updateMinMax(): void {
    if (this.dataType === 'string') return;
    this.minMax = minMax([...(this.ndarr.data as number[]), ...this.minMax]);
  }
}
