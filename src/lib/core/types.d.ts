import type { DomainTypes, Position, NdArray } from 'coveragejson';
import { Range } from './ranges';
import type { BBox } from 'geojson';

/**
 * Extra arguments for the Coverage
 */
export interface CoverageOptions {
	/**
	 * Options to be applied to each ndarray
	 */
	ranges?: RangeOptions;
	/**
	 * Force the locale of anything using I18N
	 */
	language?: string;
}

export interface RangeOptions {
	/**
	 * When a indices hit requests that tileSet, the entire tileSet is loaded
	 */
	eagerLoad?: boolean;
}

/**
 * The Properties object in the GeoJSON Feature
 */
export interface CoverageProperties<DT extends DomainTypes> {
	[x: string]: unknown;
	uuid: string;
	domainType: DT;
	parameters: string[];
	id?: string;
}

/**
 * The indices used to query the Range.
 * Can be a Map if you dont know the actual arrangement of the Range's axisNames or want the range to normalize
 * Pass a position to que
 */
export type Indices = Map<string, number> | number[];

export interface QueryOptions {
	axisNames?: Record<string, AxisNamesOptions>;
	/**
	 * The ranges to query
	 */
	ranges?: string[];
	/**
	 * Callback to executed if the data value was not previously cached
	 */
	cb?(name: string, range: Range): void;
}

export type GetDataOptions = Omit<QueryOptions, 'axisNames'>;

/**
 * In case of object, the values are inclusive
 */
export type AxisNamesOptions = boolean | number[] | Partial<Record<'start' | 'stop', number>>;

export type DataValue = string | number;

/**
 * An object where keys are the Range Ids. Also includes the axes indices for that particular row
 * @example {POTM: 1, ICEC: null, x: 0, t: 3,y: 1}
 */
export type DataRow<D extends DataValue = DataValue> = Record<string, D | null> & {
	t?: number;
	z?: number;
	x?: number;
	y?: number;
	composite?: number;
};

/**
 * Find the domain axes indices with respect to
 * Pass a x,y,z array if you want to determine best indices
 * Pass a Date String if you have a specific time you want
 * Pass a number if you have an elevation.
 * For each, if the argument does not intersect with all axes, those axes will be set to 0
 */
export type Reference = Position | string | number;

/**
 * Since OGC EDR primarily supports CoverageJSON, support these properties
 * Extensions for parameters as specified by https://schemas.opengis.net/ogcapi/edr/1.1/openapi/schemas/collections/parameterNames.yaml
 */
export interface EdrParameterProperties {
	/**
	 * Parameter measurement approach
	 * Approach to calculating the data values
	 */
	measurementType?: {
		/**
		 * @example mean
		 */
		method: string;
		/**
		 * Measurement time duration.
		 * The time duration that the value was calulated for as an RFC3339 duration value. If the method value is instantaneous, this value is not required
		 * @example PT10M
		 */
		duration?: string;
	};
	/**
	 * The data-type of the NdArray values
	 */
	'data-type'?: NdArray['dataType'];
	/**
	 * The extent of the information in the collection.
	 * Extensions may add additional members to represent other extents,for example, thermal or pressure changes
	 */
	extent?: {
		spatial: {
			bbox: BBox[];
			crs: string;
			name?: string;
		};
		temporal?: {
			interval: [string, string][];
			trs: string;
			values: string[] | null;
		};
		vertical?: {
			/**
			 * Mininum and maximum heights of the vertical interval
			 */
			interval: [string, string][];
			/**
			 * Vertical level intervals that data in the collection is available at.
			 */
			values?: string[] | null;
			/**
			 * Coordinate reference system of the coordinates in the vertical extent (property `interval`)
			 */
			vrs: string;
			/**
			 * Name of the vertical coordinate reference system
			 */
			name?: string;
		};
	};
}
