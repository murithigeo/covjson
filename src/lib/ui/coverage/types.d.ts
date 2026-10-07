import type {
	Coverage,
	DataRow,
	OnIndicesChange,
	Parameter,
	RangeStatistics
} from '#lib/core/index.ts';
import type { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { Axis, AxisConfig, resolveAxisIdx } from './axes-utils';
import type { HighlightPropsWithoutHTML } from 'layerchart';

type Props<D> = { data: D };

interface ShowOptions {
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
	selected?: SvelteSet<set>;
	/**
	 * Function to execute when a row has been highlighted
	 * Useful for displaying marker when data point is highlighted
	 */
	onIndicesChange?: OnIndicesChange;
}
export interface DataViewProps extends AxisConfig, Props<DataRow[]> {
	show?: Partial<Pick<ShowOptions, 'parameters'>>;
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
	 * Since we denormalize coverage to determine axis config, require the denormalized version of the Coverage
	 */
	coverage: DenormalizedCoverage;
	/**
	 * The current statistics of the parameter in this Coverage
	 */
	stats: RangeStatistics;
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
}

/**
 * Works best for tiled
 * Add options to toggle dimensions by header value
 */
export interface TableProps extends Props<DataRow[]> {
	axisResolver?: (axisName: Axis, idx: number) => ReturnType<typeof resolveAxisIdx>;
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
	axesSize: Map<Axis, number>;
}
