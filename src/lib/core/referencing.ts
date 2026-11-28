import type {
	ReferenceSystemConnection as RSC,
	TemporalReferenceSystem as TRS,
	Position2D
} from 'coveragejson';
import { uriproj, load, toURI, proj4, get } from '@murithigeo/uriproj';
import { isUndefined, toGeoJsonCoordinate } from './domain/utils.ts';

export const CRS84 = toURI('OGC:CRS84');

/**
 * @see https://www.mathworks.com/help/map/choose-a-3-d-coordinate-system.html
 *  ENU East North Up
 *  NED North East Down
 *  AER Azimuth Elevation Range
 *  NEU North East Up
 */

/**
 * Only reprojects x,y coordinates because we are reasonably guess their properties via spatialreference.org
 * @todo z can be reprojected if and only if the definition is in spatialreferenc.org or if the user passes a function to handle it
 */

export class Referencing extends Array<RSC> implements Converters {
	crs: (position: Position2D) => Position2D;
	trs: (v: string) => string;
	vrs: (v: number) => number;
	constructor(items: RSC[] | ReferencingOptions = []) {
		super();

		if (!Array.isArray(items)) {
			const { connections, fns } = this.optionsToConnections(items);
			this.trs = fns.trs || ((v) => v);
			this.vrs = fns.vrs || ((v) => v);
			this.crs = (p) => p;
			items = connections;
		} else {
			this.crs = (pos) => pos;
			this.vrs = (v) => v;
			this.trs = (v) => v;
		}

		this.push(...items);
	}
	/**
	 * @todo current approach replaces everything in that index. Add checks to split value into its own connection
	 */
	async to(connections: RSC[] | ReferencingOptions) {
		const converters: Partial<Converters> = {};
		let from_crs: string = CRS84; // The URI for the current CRS
		let from_vrs: string = CRS84; // The URI for the current VRS, can be from_crs
		let to_crs: string | undefined = undefined; // URI for new CRS
		let to_vrs: string | undefined = undefined; // URI for new VRS

		if (!Array.isArray(connections)) {
			const res = this.optionsToConnections(connections);
			connections = res.connections;
			if (res.fns.vrs) converters.vrs = res.fns.vrs;
			if (res.fns.trs) converters.trs = res.fns.trs;
		}
		// Nothing exists so exist and move on
		if (!this.length) {
			this.push(...connections);
			return this;
		}

		let { srs: srsIdx, trs: trsIdx, vrs: vrsIdx } = this.parse(this);

		const { trs: _trsIdx, vrs: _vrsIdx, srs: _srsIdx } = this.parse(connections);

		if (srsIdx < 0) {
			srsIdx = this.length;
			this[srsIdx] = { coordinates: ['x', 'y'], system: { type: 'GeographicCRS', id: CRS84 } };
		}

		const old_crs = this[srsIdx].system;
		if ('id' in old_crs && old_crs.id) from_crs = old_crs.id;

		if (vrsIdx < 0) {
			vrsIdx = this.length;
			this[vrsIdx] = { coordinates: ['z'], system: { type: 'VerticalCRS' } };
		}
		const old_vrs = this[vrsIdx].system;
		if ('id' in old_vrs && old_vrs.id) from_vrs = old_vrs.id;

		const incomingSrs = connections[_srsIdx];
		if (incomingSrs) {
			if ('id' in incomingSrs.system && incomingSrs.system.id) {
				to_crs = toURI(incomingSrs.system.id);
				if (_srsIdx === _vrsIdx) to_crs = incomingSrs.system.id;
			}

			this[srsIdx] = incomingSrs;
		}

		// Exists and is not part of 3D CRS
		if (_vrsIdx >= 0) {
			if (this[vrsIdx].system.type !== 'VerticalCRS') vrsIdx = this.length; // Dont wanna replace existing data
			if (_vrsIdx !== _srsIdx) {
				const connection = connections[_vrsIdx];
				if ('id' in connection.system && connection.system.id) to_vrs = connection.system.id;
				this[vrsIdx] = connection;
			}
		}

		if (trsIdx < 0) {
			trsIdx = this.length;
			this[trsIdx] = { coordinates: ['t'], system: { type: 'TemporalRS', calendar: 'Gregorian' } };
		}
		if (_trsIdx >= 0) this[trsIdx] = connections[_trsIdx];

		from_crs = toURI(from_crs);
		if (to_crs) to_crs = toURI(to_crs);

		if (to_vrs) to_vrs = toURI(to_vrs);
		from_vrs = toURI(from_vrs);

		if (!converters.vrs && to_vrs) {
			await Promise.all([from_vrs, to_vrs].filter((v) => !isUndefined(v)).map((v) => load(v)));
			const from_to_meter = proj4.defs(get(from_vrs)!).to_meter ?? 1;
			const to_to_meter = proj4.defs(get(to_vrs)!).to_meter ?? 1;
			converters.vrs = (v) => (from_to_meter / to_to_meter) * v;
		}
		if (to_crs) {
			const converter = await uriproj({ from: from_crs, to: to_crs });
			const to_def = proj4.defs(to_crs!);
			const from_def = proj4.defs(from_crs!);

			if (to_def.units === 'meter') connections[srsIdx].system.type = 'ProjectedCRS'; // We didnt await in optionsToConnections

			converters.crs = (pos) => {
				// Ensure that the coordinates argument follow the axis order of the crs defined by from
				if (from_def?.axis === 'neu') [pos[0], pos[1]] = [pos[1], pos[0]];

				pos = converter.forward(pos, true);
				for (let i = 0; i < 2; i++) {
					pos[i] = toGeoJsonCoordinate(pos[i]);
				}
				if (to_def.axis === 'enu') return pos;
				// If the `to` crs is not [lon,lat] force it to be
				pos[1] = [pos[0], (pos[0] = pos[1])][0];
				return pos;
			};
		}
		this.crs = (pos) => converters.crs?.(pos) ?? pos;
		this.vrs = (v) => converters.vrs?.(v) ?? v;
		this.trs = (v) => converters.trs?.(v) ?? v;
		return this;
	}
	parse(connections: RSC[]) {
		let vrs: number;

		const srs = connections.findIndex((d) => d.coordinates.some((c) => ['x', 'y'].includes(c)));
		if (srs >= 0 && connections[srs].coordinates.includes('z')) vrs = srs;
		else vrs = connections.findIndex((d) => d.coordinates.includes('z'));

		const trs = connections.findIndex((d) => d.coordinates.includes('t'));
		return {
			trs,
			vrs,
			srs
		};
	}

	optionsToConnections(options: ReferencingOptions) {
		const connections = Array<RSC>();
		if (options.crs) {
			options.crs.id = toURI(options.crs.id);
			const coordinates = ['x', 'y', 'z'];

			let projected: boolean = false;
			if (options.crs.z) projected = false;
			else {
				coordinates.pop();
				load(options.crs.id).then((def) => (projected = proj4.defs(def)?.units === 'meter'));
			}

			connections.push({
				coordinates,
				system: {
					type: projected ? 'ProjectedCRS' : 'GeographicCRS',
					id: options.crs.id
				}
			});
		}
		if (options.vrs) {
			connections.push({
				coordinates: ['z'],
				system: { type: 'VerticalCRS', id: options.vrs.id ? toURI(options.vrs.id) : undefined }
			});
		}
		if (options.trs) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { fn, ...rest } = options.trs;
			connections.push({ coordinates: ['t'], system: { type: 'TemporalRS', ...rest } });
		}
		return {
			connections,
			fns: { trs: options.trs?.fn, vrs: options.vrs?.fn }
		};
	}
	toJSON() {
		return [...this];
	}
	/**
	 * Reset the converters once finished reprojecting
	 */
	reset() {
		this.crs = (p) => p;
		this.vrs = (p) => p;
		this.trs = (p) => p;
	}
}

export interface ReferencingOptions {
	/**
	 * CRS Identifier
	 */
	crs?: {
		id: string;
		/**
		 * Z becomes part of the CRS, suitable for Geographic 3D CRS
		 * Otherwise split into its own thing
		 */
		z?: boolean;
	};
	vrs?: {
		id: string;
		fn?: Converters['vrs'];
	};
	trs?: Pick<TRS, 'timeScale' | 'calendar'> & {
		fn: (v: string) => string;
	};
}

interface Converters {
	trs: (v: string) => string;
	crs: (position: Position2D) => Position2D;
	vrs: (v: number) => number;
}
