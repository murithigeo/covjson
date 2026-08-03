import type {
  Position,
  ReferenceSystemConnection as RSC,
  SpatialReferenceSystem
} from 'coveragejson';
import { Temporal } from '@js-temporal/polyfill';
import { uriproj, load, toURI, proj4 } from '@murithigeo/uriproj';
import { isUndefined } from './domain/utils.ts';

const CRS84 = toURI('OGC:CRS84');

/**
 * @see https://www.mathworks.com/help/map/choose-a-3-d-coordinate-system.html
 *  ENU East North Up
 *  NED North East Down
 *  AER Azimuth Elevation Range
 *  NEU North East Up
 */

interface ReferencingOptions {
  crs: { from: string; to: string };
  vrs: { from?: string; to?: string };
  timezone: string | undefined;
}
export interface UserReferencingOptions {
  crsId?: string;
  timeZone?: string;
  vrsId?: string;
}

// type CrsConvert<T extends Position = Position> = (val: T) => T;
// type VrsConverter = (val: number) => number;
// type TrsConverter = (val: string) => string;

export class Referencing {
  connections: RSC[];
  options: ReferencingOptions;
  userOptions: UserReferencingOptions;
  constructor(
    options: ReferencingOptions,
    userOptions: UserReferencingOptions,
    connections: RSC[]
  ) {
    this.options = options;
    this.userOptions = userOptions;
    this.connections = connections;
  }

  /**
   * @param pos [longitude,latitude]
   * @returns {Extract<Position,[number,number]>} Will always return in lon-lat
   */
  crs<T extends Position>(pos: T): T {
    const { crs } = this.options;
    // Ensure that the coordinates argument follow the axis order of the crs defined by from
    if (proj4.defs(crs.from).axis === 'neu') [pos[0], pos[1]] = [pos[1], pos[0]];

    const converter = proj4(crs.from, crs.to);
    pos = converter.forward(pos, true);
    if (pos[2]) pos[2] = this.vrs(pos[2]);
    if (proj4.defs(this.options.crs.to).axis === 'enu') return pos;
    // If the `to` crs is not [lon,lat] force it to be
    pos[1] = [pos[0], (pos[0] = pos[1])][0];
    return pos;
  }

  /**
   * @todo ensure that the referencing object also has info about the output units
   * Gets only the multiplication/division factor to convert desired units
   * The intermediate factor is meters
   */
  public get vrsFactor(): number {
    const vrs = this.options.vrs;
    let from_source = vrs.from ? proj4.defs(vrs.from)?.to_meter : undefined;
    let to_target = vrs.to ? proj4.defs(vrs.to)?.to_meter : undefined;
    if (isUndefined(from_source)) from_source = 1;
    if (isUndefined(to_target)) to_target = 1;
    const factor = from_source / to_target;
    return factor;
  }
  vrs(z: number): number {
    return this.vrsFactor * z;
  }
  trs(t: string) {
    // Only reproject the datetime leaving everything as is
    if (t.split('T').length !== 2) return t;
    return Temporal.Instant.from(t)
      .toZonedDateTimeISO(this.options.timezone || 'UTC')
      .withTimeZone(this.options.timezone || 'UTC')
      .toString({
        timeZoneName: 'never',
        calendarName: 'never'
      });
  }

  static async load(options: UserReferencingOptions | Referencing, connections: RSC[] = []) {
    options = options instanceof Referencing ? options.userOptions : options;

    let crsIndex = connections.findIndex(({ coordinates }) =>
      coordinates.some((axisName) => ['x', 'y'].includes(axisName))
    );
    if (crsIndex === -1) {
      crsIndex =
        connections.push({
          coordinates: ['x', 'y'],
          system: { type: 'GeographicCRS', id: CRS84 }
        }) - 1;
    }

    let trsIndex = connections.findIndex(({ coordinates }) => coordinates.indexOf('t') !== -1);
    if (trsIndex === -1) {
      trsIndex =
        connections.push({
          coordinates: ['t'],
          system: { type: 'TemporalRS', calendar: 'Gregorian' }
        }) - 1;
    }

    let vrsIndex = connections.findIndex(
      ({ coordinates, system }) => coordinates.includes('z') || system.type === 'VerticalCRS'
    );

    // Spin into separate connection object
    if (vrsIndex === -1 || vrsIndex === crsIndex) {
      vrsIndex = connections.push({ coordinates: ['z'], system: { type: 'VerticalCRS' } }) - 1;
    }

    const horizontal = connections[crsIndex].system as SpatialReferenceSystem;
    const vertical = connections[vrsIndex].system as SpatialReferenceSystem;

    if (options.crsId) options.crsId = toURI(options.crsId);
    if (options.vrsId) options.vrsId = toURI(options.vrsId);
    const from_crs = horizontal.id ? toURI(horizontal.id) : CRS84;
    const to_crs = options.crsId || CRS84;
    const to_vrs = options.vrsId ? options.vrsId : undefined;
    const from_vrs = vertical.id ? toURI(vertical.id) : undefined;

    // Can't do promise.all([...defs]) because in testing, requests get resolved by spatialreference.org instead of mws
    await uriproj({ from: from_crs, to: to_crs });
    if (to_vrs) await load(to_vrs);
    if (from_vrs) await load(from_vrs);

    connections[crsIndex] = {
      coordinates: ['x', 'y'],
      system: {
        type: proj4.defs(to_crs)?.units === 'meter' ? 'ProjectedCRS' : 'GeographicCRS',
        id: to_crs
      }
    };
    connections[vrsIndex] = {
      coordinates: ['z'],
      system: {
        type: 'VerticalCRS',
        // Maybe make it optional
        id: to_vrs
      }
    };
    connections[trsIndex] = {
      coordinates: ['t'],
      system: {
        type: 'TemporalRS',
        calendar: 'Gregorian'
      }
    };

    return new Referencing(
      {
        crs: { from: toURI(from_crs), to: toURI(to_crs) },
        vrs: { from: from_vrs, to: to_vrs },
        timezone: options?.timeZone
      },
      options,
      connections
    );
  }
}

// class Crs<T extends Position>{
// 	connections: RSC[];
// 	constructor(cb: (pos: T) => T, connections: RSC[]) {
// 		this.connections = connections;

// 	}
// 	forward: (pos: T) => T;
// 	inverse: (pos: T) => T;

// 	load(options: { from: string; to: string }): Promise<Crs>{

// 		// Just determine the axis order once
// 	}
// }
