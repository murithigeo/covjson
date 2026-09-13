import type {
  Parameter as PR,
  Category as Cat,
  UnitSymbol as USymbol,
  ObservedProperty as Obs,
  I18N as I18n,
  Unit as U,
  CategoryEncoding as CatEncoding
} from 'coveragejson';
import { isUndefined } from './domain/utils.ts';

abstract class Metadata<T> {
  abstract toPlain(): T;
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
  getPrimaryTag(tag: string) {
    return tag.split('-')[0];
  }
  getTagName(tag: string) {
    const name = new Intl.DisplayNames(this.language, { type: 'language' }).of(tag);
    if (name === 'root') return 'Undetermined';
    return name;
  }
}

export class Parameter extends Metadata<PR> {
  type: 'Parameter';
  label: I18N;
  description: I18N;
  observedProperty: ObservedProperty;
  id: string | undefined;
  key: string;
  unit: Unit | undefined;
  categoryEncoding?: Map<string, number[]>;
  constructor(pr: PR, key: string) {
    super();
    this.type = pr.type;
    this.label = new I18N(pr.label);
    this.description = new I18N(pr.description);
    this.id = pr.id;
    this.key = key;
    this.observedProperty = new ObservedProperty(pr.observedProperty);
    if (pr.unit) this.unit = new Unit(pr.unit);
    if (pr.categoryEncoding) {
      this.categoryEncoding = new Map();
      Object.entries(pr.categoryEncoding)
        .map(([key, val]) => [key, Array.isArray(val) ? val : [val]] as const)
        .forEach(([key, val]) => this.categoryEncoding?.set(key, val));
    }
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
  getCategoryId(int: number): Category | undefined {
    if (!this.categoryEncoding) return undefined;
    const id = this.categoryEncoding.entries().find(([, values]) => values.includes(int))?.[0];
    if (!id) return undefined;
    return this.observedProperty.categories?.find((cat) => cat.id === id);
  }
}

// export class Categories extends Map<string,{label:n}

export class CategoryEncoding extends Map<string, number[]> {
  constructor(encodings: CatEncoding) {
    super(Object.entries(encodings).map(([key, val]) => [key, Array.isArray(val) ? val : [val]]));
  }
}

export class ObservedProperty extends Metadata<Obs> {
  categories: Category[] | undefined;
  id: string | undefined;
  label: I18N;
  description: I18N;

  constructor(obs: Obs) {
    super();
    this.id = obs?.id;
    this.label = new I18N(obs.label);
    this.description = new I18N(obs.description);
    if (obs.categories) this.categories = obs.categories.map((e) => new Category(e));
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
  constructor(unit: U) {
    super();
    if ('label' in unit && unit.label) this.label = new I18N(unit.label);
    else this.label = new I18N(undefined);
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

  format(value: number): string {
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
  constructor(obj: Cat) {
    super();
    this.label = new I18N(obj.label);
    this.description = new I18N(obj.description || {});
    this.id = obj.id;
  }
  toPlain(): Cat {
    return {
      id: this.id,
      label: Object.fromEntries(this.label),
      description: this.description.size ? Object.fromEntries(this.description) : undefined
    };
  }
}
