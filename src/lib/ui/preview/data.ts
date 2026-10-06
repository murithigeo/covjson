const prefix = 'https://covjson.org/playground/coverages';

const names = [
	'Grid Categorical',
	'Grid Domain',
	'Grid Domain BNG',
	'Grid Tiled',
	'Grid',
	'MultiPolygon',
	'Point Collection',
	'Point',
	'PointSeries',
	'PolygonSeries',
	'Profile Collection',
	'Profile',
	'Trajectory'
] as const;
/**
 * https://github.com/covjson/playground
 */
export default Object.fromEntries(
	names
		.map((name) => `${prefix}/${name.replaceAll(' ', '-').toLowerCase()}.covjson`)
		.map((url, i): [(typeof names)[number], string] => [names[i], url])
) as Record<(typeof names)[number], string>;
