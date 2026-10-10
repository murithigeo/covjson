import type {
	Coverage,
	DataRow,
	OnIndicesChange,
	Parameter,
	Range,
	RangeOptions,
	RangeStatistics,
	WithRequiredProperty
} from '#lib/core/index.ts';
import type { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { ChartPropsWithoutHTML, HighlightPropsWithoutHTML } from 'layerchart';
import type { Section, Polygon, Trajectory, MultiPoint, MultiPolygon } from 'coveragejson';
import type { AxisNamesOptions, QueryOptions } from '#lib/core/types.js';

type Props<D> = { data: D };

interface ShowOptions {
	/**
	 * Whether to show axis configuration tab
	 */
	axes?: boolean;
	/**
	 * Whether to render the parameter
	 * If not, the f(x) tab trigger will not be shown and neither will the tab content
	 */
	parameters?: boolean;
	/**
	 * Whether the render the parameterGroups included in the coverage
	 * If false, the tab will not be shown
	 */
	parameterGroups?: boolean;
	/**
	 * Whether to show Download options
	 */
	downloads?: boolean;
}
interface ActionOptions {
	/**
	 * Whether to render the Pin icon
	 */
	pinnable?: boolean;
	/**
	 * Whether to render the Trash Icon
	 */
	trashable?: boolean;
}
interface CoverageOptions {
	show?: ShowOptions;
	actions?: ActionOptions;
	/**
	 * Parameter Keys and their default colors
	 */
	color?: SvelteMap<string, string>;
	/**
	 * Parameter Categories and their colors
	 */
	categoryColor?: SvelteMap<string, SvelteMap<string, string>>;
}

export interface CoverageProps extends CoverageOptions, Props<Coverage> {
	/**
	 * Function to call when the Trash icon is clicked
	 */
	onTrashCoverage?: (c: Coverage) => void;
	/**
	 * Whether the Coverage has been persisted
	 */
	pinned?: boolean;
	/**
	 * Bindable list of currently selected parameters
	 * Defaults to the keys of ranges in the coverage
	 */
	selected?: SvelteSet<string>;
	/**
	 * Function to execute when a row has been highlighted
	 * Useful for displaying marker when data point is highlighted
	 */
	onIndicesChange?: OnIndicesChange;
}
export interface DataViewProps extends Props<DataRow[]> {
	axisResolver?: AxisResolver;
	axesConfig?: AxisConfig;
	rangeOptions?: RangeOptions;
	show?: Partial<Pick<ShowOptions, 'parameters' | 'axes'>>;
	/**
	 * The currently active tab
	 * For "string" parameters, this will default to table
	 */
	tabValue: 'chart' | 'table' | 'param-info' | 'download';
	/**
	 * The currently highligted data row
	 * Primarily powered by layerchart
	 */
	tooltip: DataRow | null;

	/**
	 * The current statistics of the parameter in this Coverage
	 */
	range: Range;
	/**
	 * See {@link HighlightPropsWithoutHTML.facetAll}
	 */
	facetAll?: boolean;
	/**
	 * The parameter itself.
	 * Can probably be undefined if not in Coverage in which case use the string
	 */
	parameter: Parameter | string;
	/**
	 * The current of the parameter
	 */
	color?: string;
	/**
	 * The colors of the categories if any
	 */
	categoryColors?: SvelteMap<string, string>;
	/**
	 * The coverage's identifier
	 */
	covId: string;
	/**
	 * If the component renders data from Coverage, then the range may not include 1D axes
	 * @todo decouple data fetching/dimensions from coverage
	 */
	axes?: Axes;
	/**
	 * Currently selected axis indices
	 */
	axisNames?: SvelteMap<string, AxisNamesOptions>;
}

type Axes = [Axis, number][];
/**
 * Works best for tiled
 * Add options to toggle dimensions by header value
 */
export interface TableProps extends Props<DataRow[]> {
	axisResolver?: AxisResolver;
	/**
	 * The parameter key value.
	 * Used in table caption
	 */
	key: string;
	/**
	 * Parameter is categoric, meaning we expect a "category" member in each row
	 */
	categoric?: boolean;
	/**
	 * We can also go by the unique axis values in the data
	 */
	axes: Axes;
}

interface DownloaderProps extends Props<DataRow[]> {
	axisResolver?: AxisResolver;
	/**
	 * Needed for downloading chart images
	 */
	ref?: HTMLElement;
	/**
	 * Whether the dataset is categoric
	 */
	categoric: boolean;
	/**
	 * The axis names in the dataset. Used to create the header for CSV
	 */
	axisNames: string[];
	/**
	 * The name of the file
	 */
	filename?: string;
}

/**
 * Get the actual value of the axisName index in a row
 */
export type AxisResolver = (
	axisName: Axis,
	idx: number
) =>
	| string
	| number
	| (Polygon | MultiPoint | Section | Trajectory)['axes']['composite']['values'][number];

export type AxisConfig = SvelteMap<ChartDimensions, Axis>;
export type ChartDimensions = 'x' | 'fx' | 'fy' | 'y1';

export interface AxisConfiguratorProps {
	config: AxisConfig;
	axes: Axes;
	axisNames?: DataViewProps['axisNames'];
	axisResolver?: AxisResolver;
}
export type Axis = 'x' | 'y' | 'composite' | 'z' | 't';
