import type { Coverage } from '#lib/core/coverage.js';
import type {
	OnIndicesChange,
	Parameter,
	DataValue,
	AxisNamesOptions,
	EdrParameterProperties,
	CustomDate
} from '#lib/core/index.js';
import type { Domain } from 'coveragejson';
import type { BrushDomainType, ChartState } from 'layerchart';

export interface RangeStatistics extends Pick<EdrParameterProperties, 'data-type'> {
	/**
	 * Defaults to null for string NdArrays
	 */
	min?: number | null;
	/**
	 * Defaults to null for string NdArrays
	 */
	max?: number | null;
	/**
	 * The middle value of the values
	 */
	median?: string | number | null;
	/**
	 * The average of the NdArray
	 */
	mean?: number | null;
	/**
	 * Provided a categoryEncoding object, calculate the bins
	 */
	frequency?: Map<string, number> | null;
	/**
	 * Total count of values
	 */
	totalSize: number;
}
export type Data = Array<DataRow>;
/**
 * The currently highlighted data points
 */
export type Tooltip = Array<DataRow>;

type Axes = Map<Axis, number>;
export type ChartDimension = 'x' | 'fx' | 'fy' | 'series';

export type Axis = 'x' | 'y' | 'composite' | 'z' | 't';

/**
 * Internal resolver for an axis index.
 * When chart is set, //@todo check
 */
export type AxisResolver = (a: Axis, i: number, mode?: 'chart') => string | number | CustomDate;

/**
 *
 */
export interface Formatters<D extends Domain = Domain> {
	/**
	 * Format the value of a parameter
	 * @param key The parameter name
	 * @param val The value to format
	 * If undefined is returned, the internal formatter is used
	 */
	value?: (key: string, val: DataValue) => string | undefined;
	/**
	 * Format an axis value
	 * @example (d,i,v)=>["Germany","Kenya"][i]
	 */
	axis?: (
		d: D['domainType'],
		i: number,
		options: { mode?: 'chart'; value: unknown; axisName: Axis }
	) => string;
}

export type FormatWithUnit = (key: string, val: DataValue) => string | undefined;

/**
 * An object to customize the color of chart splines
 */
export type Colors = Record<string, ParameterColor>;

interface ParameterColor {
	/**
	 * The default color
	 * If the parameter is categorical, it will be used as fallback
	 */
	default: string;
	[x: string]: string;
}

/**
 * How the chart axes are configured
 */
export type Config = Partial<Record<ChartDimension, Axis>>;

export interface CoverageOptions<D extends Domain = Domain> {
	coverage: Coverage<D>;
	/**
	 * Only show these parameters
	 * Defaults to all range keys
	 */
	selected?: string[];
	/**
	 * Colors for the chart splines
	 */
	colors?: Colors;
	/**
	 * Callback to execute when the current Coverage indices change. Mostly when hovering over chart point
	 */
	onIndicesChange?: OnIndicesChange;
	/**
	 *  @todo show badge that parameter belongs to particular ParameterGroup
	 */
	show?: Record<'parameters' | 'parameterGroups', boolean>;
	/**
	 * Id for the component
	 */
	id?: string;
	/**
	 * Which axis values to load etc
	 */
	axisNames?: Record<string, AxisNamesOptions>;
	config?: Config;
	formatters?: Formatters<D>;

	labels?: Partial<
		Record<
			'title' | 'description',
			| {
					/**
					 * Value exists on Coverage
					 */
					key: string;
			  }
			| {
					/**
					 * Literal value
					 */
					value: string;
			  }
		> & {}
	>;
}

export type View = 'chart' | 'table' | 'parameter';
export type AxesSize = Map<Axis, number>;
export interface DataViewProps extends Required<
	Pick<CoverageOptions, 'axisNames' | 'colors' | 'config'>
> {
	view: View;
	xDomain?: BrushDomainType;
	resolver: AxisResolver;
	colors: Colors;
	parameter: Parameter | string;
	info: RangeStatistics | undefined;
	data: Data;
	/**
	 * For the table
	 */
	cache: Data;
	tooltip: Tooltip;
	axesSize: AxesSize;
	format: NonNullable<Formatters['value']>;
	rangeIds: string[];
}

export interface TooltipProps {
	colors: Colors;
	series: Axis | undefined;
	context: ChartState;
	tooltip: Tooltip;
	/**
	 * The current active parameter
	 */
	active: string;
	/**
	 * Currently viewed data
	 */
	data: Data;
	format: Formatters['value'];
	resolver: AxisResolver;
	axesSize: AxesSize;
	rangeIds: string[];
}

export interface TableProps extends Partial<Pick<RangeStatistics, 'totalSize'>> {
	axesSize: Map<Axis, number>;
	data: Data;
	categoric: boolean;
	key: string;
	resolver: AxisResolver;
}
