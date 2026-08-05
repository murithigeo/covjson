import type {
	Parameter as PR,
	Category as Cat,
	UnitSymbol as USymbol,
	ObservedProperty as Obs,
	I18N as I18n,
	Unit as U
} from 'coveragejson';
/**
 * https://bobbyhadz.com/blog/typescript-make-property-required
 */
type WithRequiredProperty<Type, Key extends keyof Type> = Type & {
	[Property in Key]-?: Type[Property];
};
abstract class Metadata<T> {
	abstract toPlain(): T;
	abstract label?: I18N;
	abstract description?: I18N;
	abstract id?: string;
}

export class I18N extends Map<string, string> {
	constructor(value?: Iterable<readonly [string, string]> | null | undefined, locale?: string) {
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
	getPrimaryTag(tag: string) {
		return tag.split('-')[0];
	}
	getTagName(tag: string) {
		const name = new Intl.DisplayNames(this.language, { type: 'language' }).of(tag);
		if (name === 'root') return 'Undetermined';
		return name;
	}
	get language() {
		return navigator.language;
	}
}

export class Parameter extends Metadata<PR> {
	type: 'Parameter';
	label: I18N;
	description: I18N;
	observedProperty: ObservedProperty;
	id: string | undefined;
	key: string | undefined;
	unit: Unit | undefined;
	categoryEncoding?: Map<string, number[]>;
	/**
	 * The statistics of the ranges covered by this parameter
	 */
	stats: { minMax?: [number | null, number | null]; count?: number };
	constructor(pr: PR, key?: string, locale?: string) {
		super();
		this.type = pr.type;
		this.label = new I18N(Object.entries(pr.label || {}), locale);
		this.description = new I18N(Object.entries(pr.description || {}), locale);
		this.id = pr.id;
		this.key = key;
		this.observedProperty = new ObservedProperty(pr.observedProperty, locale);
		if (pr.unit) this.unit = new Unit(pr.unit, locale);
		if (pr.categoryEncoding) {
			this.categoryEncoding = new Map();
			for (let key in pr.categoryEncoding) {
				let val = pr.categoryEncoding[key];
				if (!Array.isArray(val)) val = [val];
				this.categoryEncoding.set(key, val);
			}
		}
		this.stats = {};
	}
	toPlain(): PR {
		return {
			type: this.type,
			observedProperty: this.observedProperty?.toPlain(),
			unit: this.observedProperty.categories ? undefined : this.unit?.toPlain(),
			label: this.label.size ? Object.fromEntries(this.label) : undefined,
			description: this.description.size ? Object.fromEntries(this.description) : undefined
		};
	}
}

export class ObservedProperty extends Metadata<Obs> {
	categories: Category[] | undefined;
	id: string | undefined;
	label: I18N;
	description: I18N;

	constructor(obs: Obs, locale?: string) {
		super();
		this.id = obs?.id;
		this.label = new I18N(Object.entries(obs.label), locale);
		this.description = new I18N(Object.entries(obs.description || {}), locale);
		if (obs.categories) this.categories = obs.categories.map((e) => new Category(e, locale));
	}
	categoryIndex(id: string) {
		if (!this.categories) return -1;
		return this.categories?.findIndex((i) => i.id === id);
	}
	/**
	 * Destructive
	 */
	addCategory(
		category: CoverageJSON.Category | Category
	): WithRequiredProperty<this, 'categories'> {
		if (!(category instanceof Category)) category = new Category(category);

		const idx = this.categoryIndex(category.id);
		this.categories = this.categories || [];
		if (idx) this.categories[idx] = category;
		else this.categories.push(category);
		return this;
	}
	toPlain(): Obs {
		return {
			id: this.id,
			label: Object.fromEntries(this.label),
			description: this.description.size ? Object.fromEntries(this.description) : undefined,
			categories: this.categories?.length
				? (this.categories.map((cat) => cat.toPlain()) as [Cat, ...Cat[]])
				: undefined
		};
	}
}

export class Unit extends Metadata<U> {
	label: I18N;
	description = undefined;
	id?: string;
	symbol?: Symbol;
	constructor(unit: U, locale?: string) {
		super();
		//@ts-expect-error fix the types
		this.label = new I18N(unit.label, locale);
		this.id = unit?.id;
		if ('symbol' in unit) this.symbol = new Symbol(unit.symbol);
	}
	toPlain(): CoverageJSON.Unit {
		const unit: CoverageJSON.Unit = {
			id: this.id,
			label: Object.fromEntries(this.label),
			symbol: this.symbol?.toPlain()
		};
		return unit;
	}
}

export class Symbol extends Metadata<USymbol> {
	label = undefined;
	description = undefined;
	id = undefined;
	public value: string;
	public type = '';
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
	toPlain(): USymbol {
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

	constructor(obj: CoverageJSON.ParameterGroup, locale?: string) {
		super();
		this.id = obj.id;
		if ('observedProperty' in obj)
			this.observedProperty = new ObservedProperty(obj.observedProperty, locale);
		this.label = new I18N(Object.entries(obj.label || {}), locale);
		this.description = new I18N(Object.entries(obj.description || {}), locale);
		this.members = obj.members.map((id) => id.toUpperCase());
	}
	hasParameter(id: string) {
		return this.members.includes(id.toUpperCase());
	}
	toPlain(): CoverageJSON.ParameterGroup {
		const value: CoverageJSON.ParameterGroup = {
			type: this.type,
			members: this.members as [string, ...string[]],
			observedProperty: this.observedProperty?.toPlain(),
			label: Object.fromEntries(this.label)
		};

		return value;
	}
}

export class Category extends Metadata<Cat> {
	id: string;
	label: I18N;
	description: I18N;
	constructor(obj: Cat, locale?: string) {
		super();
		this.label = new I18N(Object.entries(obj.label), locale);
		this.description = new I18N(Object.entries(obj.description || {}), locale);
		this.id = obj.id;
	}
	toPlain(): Cat {
		return {
			id: this.id,
			label: Object.fromEntries(this.label),
			description: this.description?.size ? Object.fromEntries(this.description) : undefined
		};
	}
}
