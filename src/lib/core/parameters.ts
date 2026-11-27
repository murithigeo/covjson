import type {
	Parameter as PR,
	Category as Cat,
	UnitSymbol as USymbol,
	ObservedProperty as Obs,
	I18N as I18n,
	Unit as U,
	CategoryEncoding as CatEncoding
} from 'coveragejson';
import { isNull, isUndefined } from './domain/utils.js';
import type { EdrParameterProperties } from './types.js';

abstract class Metadata<T> {
	abstract toJSON(): T;
	abstract label?: I18N;
	abstract description?: I18N;
	abstract id?: string;
}

export class I18N extends Map<string, string> {
	language = navigator.language;
	constructor(value?: I18n | undefined | string | [string, string][]) {
		if (!isUndefined(value)) {
			if (typeof value === 'string') value = [['en', value]];
			if (!Array.isArray(value)) value = Object.entries(value);
		}
		super(value);
	}
	query(key: string = this.language): Record<'tag' | 'value', string> | undefined {
		if (this.size === 0) return undefined;
		if (!this.has(key)) key = this.getPrimaryTag(key);
		if (!this.has(key)) [key] = this.keys();
		return { tag: key, value: this.get(key)! };
	}
	getTagOfValue(value: string | undefined): string {
		if (!value) return 'und';
		return this.entries().find((x) => x[1] === value)?.[0] || 'und';
	}
	/**
	 * Return the primary tag of locale tag
	 */
	getPrimaryTag(tag: string) {
		return tag.split('-')[0];
	}
	/**
	 * Get language of tag
	 */
	getTagName(tag: string) {
		const name = new Intl.DisplayNames(this.language, { type: 'language' }).of(tag);
		if (name === 'root') return 'Undetermined';
		return name;
	}
	toJSON() {
		return Object.fromEntries(this);
	}
}

export class Parameter extends Metadata<PR & EdrParameterProperties> {
	type: 'Parameter';
	label: I18N;
	description: I18N;
	observedProperty: ObservedProperty;
	id: string | undefined;
	key: string;
	unit: Unit | undefined;
	categoryEncoding?: CategoryEncoding;
	properties: EdrParameterProperties & Record<string, unknown>;

	constructor(pr: PR, key: string) {
		const {
			type,
			label,
			description,
			id,
			unit,
			observedProperty,
			categoryEncoding,
			...properties
		} = pr;
		super();
		this.type = type;
		this.label = new I18N(label);
		this.description = new I18N(description);
		this.id = id;
		this.key = key;
		if (unit) this.unit = new Unit(unit);
		if (categoryEncoding) this.categoryEncoding = new CategoryEncoding(categoryEncoding);
		this.observedProperty = new ObservedProperty(observedProperty, this.categoryEncoding);
		this.properties = properties;
	}

	toJSON(): PR & EdrParameterProperties {
		return {
			type: this.type,
			observedProperty: this.observedProperty?.toJSON(),
			unit: this.observedProperty.categories ? undefined : this.unit?.toJSON(),
			label: this.label.size ? this.label.toJSON() : undefined,
			description: this.description.size ? this.description.toJSON() : undefined,
			categoryEncoding: this.categoryEncoding?.toJSON(),
			...this.properties
		};
	}
	/**
	 *
	 * @param val {string|number} so as not to keep doing val as number
	 * @returns
	 */
	getCategory(val: number | string): Category | undefined {
		if (typeof val !== 'number' || !this.categoryEncoding) return undefined;
		const id = this.categoryEncoding.entries().find(([, values]) => values.includes(val))?.[0];
		if (!id) return undefined;
		return this.observedProperty.categories?.find((cat) => cat.id === id);
	}
	bin(values: Array<number | null>) {
		if (!this.categoryEncoding) return undefined;
		if (this.properties['data-type'] === 'string') return undefined;
		const nonNulls = values.filter((d) => !isNull(d));
		const map = new Map<string, number>();
		map.set('NULL', values.length - nonNulls.length);
		for (const [id, vals] of this.categoryEncoding) {
			map.set(id, vals.filter((v) => vals.includes(v)).length);
		}
		return map;
	}
}

export class CategoryEncoding extends Map<string, number[]> {
	constructor(encodings: CatEncoding) {
		super(Object.entries(encodings).map(([key, val]) => [key, Array.isArray(val) ? val : [val]]));
	}
	toJSON() {
		return Object.fromEntries(this);
	}
}

export class ObservedProperty extends Metadata<Obs> {
	categories: Category[] | undefined;
	id: string | undefined;
	label: I18N;
	description: I18N;

	constructor(obs: Obs, catEncoding?: Map<string, number[]>) {
		super();
		this.id = obs?.id;
		this.label = new I18N(obs.label);
		this.description = new I18N(obs.description);
		if (obs.categories)
			this.categories = obs.categories.map((e) => new Category(e, catEncoding?.get(e.id)));
	}

	toJSON(): Obs {
		return {
			id: this.id,
			label: Object.fromEntries(this.label),
			description: this.description.size ? Object.fromEntries(this.description) : undefined,
			categories: this.categories?.length
				? (this.categories.map((cat) => cat.toJSON()) as [Cat, ...Cat[]])
				: undefined
		};
	}
}

export class Unit extends Metadata<U> {
	label: I18N;
	description = undefined;
	id?: string;
	symbol?: Symbol;
	constructor(unit: U) {
		super();
		if ('label' in unit && unit.label) this.label = new I18N(unit.label);
		else this.label = new I18N(undefined);
		this.id = unit?.id;
		if ('symbol' in unit) this.symbol = new Symbol(unit.symbol);
	}
	toJSON(): CoverageJSON.Unit {
		const unit: CoverageJSON.Unit = {
			id: this.id,
			label: Object.fromEntries(this.label),
			symbol: this.symbol?.toJSON()
		};
		return unit;
	}

	format(value: number | string | null): string {
		if (isNull(value)) return 'NULL';
		if (!this.symbol?.value) return value.toString();
		return value + this.symbol.value;
	}
}

export class Symbol extends Metadata<USymbol> {
	label = undefined;
	description = undefined;
	id = undefined;
	value: string;
	type = '';
	constructor(sym: USymbol) {
		super();
		if (typeof sym === 'string') this.value = sym;
		else {
			this.type = sym.type;
			this.value = sym.value;
		}
	}
	setScheme(scheme: string) {
		this.type = scheme;
		return this;
	}
	setValue(value: string) {
		this.value = value;
		return this;
	}
	toJSON(): USymbol {
		if (!this.type) return this.value;
		return { type: this.type, value: this.value };
	}
}

export class ParameterGroup extends Metadata<CoverageJSON.ParameterGroup> {
	type: CoverageJSON.ParameterGroup['type'] = 'ParameterGroup';
	id?: string | undefined;
	observedProperty: ObservedProperty | undefined;
	label: I18N;
	description: I18N;
	members: string[];

	constructor(obj: CoverageJSON.ParameterGroup) {
		super();
		this.id = obj.id;
		if ('observedProperty' in obj && obj.observedProperty)
			this.observedProperty = new ObservedProperty(obj.observedProperty);
		this.label = new I18N(obj.label);
		this.description = new I18N(obj.description);
		this.members = obj.members.map((id) => id.toUpperCase());
	}
	hasParameter(id: string) {
		return this.members.includes(id.toUpperCase());
	}
	toJSON(): CoverageJSON.ParameterGroup {
		const value: CoverageJSON.ParameterGroup = {
			type: this.type,
			members: this.members as [string, ...string[]],
			observedProperty: this.observedProperty?.toJSON(),
			label: Object.fromEntries(this.label)
		};

		return value;
	}
}

export class Category extends Metadata<Cat> {
	id: string;
	label: I18N;
	description: I18N;
	values: number[];
	constructor(obj: Cat, values: number[] = []) {
		super();
		this.label = new I18N(obj.label);
		this.description = new I18N(obj.description || {});
		this.id = obj.id;
		this.values = values;
	}
	toJSON(): Cat {
		return {
			id: this.id,
			label: Object.fromEntries(this.label),
			description: this.description.size ? Object.fromEntries(this.description) : undefined
		};
	}
}
