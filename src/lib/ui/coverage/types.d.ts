type Axes = Map<Axis, number>;
export type ChartDimensions = 'x' | 'fx' | 'fy' | 'series';

export type Axis = 'x' | 'y' | 'composite' | 'z' | 't';

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
