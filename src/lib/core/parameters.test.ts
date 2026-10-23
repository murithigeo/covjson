import { describe, it, expect } from 'vitest';
import { Symbol, Unit, Parameter, ParameterGroup, Category, I18N } from './parameters.ts';

describe('I18N', () => {
	describe('.query', () => {
		const v = new I18N({ en: 'Test String', swa: 'Test String but in Swahili' });
		it('Returns the k,v of the initiated locale', () => {
			expect(v.query('swa')).toEqual({ tag: 'swa', value: 'Test String but in Swahili' });
		});
		it('Returns the k/v of the specified locale if supplied', () => {
			expect(v.query('en')).toEqual({ tag: 'en', value: 'Test String' });
		});
		it('Returns the k/v of the first k/v if supplied locale is not found', () => {
			expect(v.query('in')).toEqual({ tag: 'en', value: 'Test String' });
		});
		it('Returns the k/v of the en member if supplied with granular locale but no such value exists', () => {
			expect(v.query('en-KE')).toEqual({ tag: 'en', value: 'Test String' });
		});
	});

	describe('.locales', () => {
		const locale = new I18N({ und: 'Gibberish' });
		it('Returns the keys of object', () => {
			locale.set('swa', 'Gibberish2');
			expect(locale.keys().toArray()).toEqual(['und', 'swa']);
		});
	});

	describe('.getLanguage', () => {
		const locale = new I18N({ und: 'Gibberish' });
		it('Returns just the prefix if supplied string is granular', () => {
			expect(locale.getPrimaryTag('en-KE')).toEqual('en');
		});
	});

	describe('.register/.delete', () => {
		const v = new I18N();
		it('.register: persists the new members', () => {
			expect(v.set('en', 'Randomgibberish').query('en')).toEqual({
				tag: 'en',
				value: 'Randomgibberish'
			});
		});
		it('.delete: Removes specified keys', () => {
			v.delete('en');
			expect(v.query('en')).toBeUndefined();
		});
	});

	describe('.getTagName', () => {
		const v = new I18N();
		it("Resolves 'und' to Undetermined", () => {
			expect(v.getTagName('und')).toBe('Undetermined');
		});
		it('Resolves regional dialects', () => {
			expect(v.getTagName('en-KE')).toBe('English (Kenya)');
		});
	});
});

describe('Symbol', () => {
	const sym = new Symbol('Kelvin');
	it('Has value', () => {
		expect(sym.value).toBe('Kelvin');
	});
});

describe('Unit', () => {
	const unit = new Unit({
		id: 'Celsius',
		label: { en: 'tw' },
		symbol: { type: 'UCUM', value: '°C' }
	});
	it('has prop id', () => {
		expect(unit.id).toBe('Celsius');
	});
	it('has label', () => {
		expect(unit.label).toBeInstanceOf(I18N);
	});
	it('symbol undefined if not specified', () => {
		expect(unit.symbol).toBeUndefined();
	});
	it('formats values properly', () => {
		expect(unit.format(21)).toBe('21°C');
	});
});

describe('ParameterGroup', () => {
	const group = new ParameterGroup({
		type: 'ParameterGroup',
		id: 'Temperature',
		members: ['Temperature', 'DewPoint'],
		label: {}
	});
	it('.hasParameter is case insensitive', () => {
		expect(group.hasParameter('TemperATURE')).toBeTruthy();
	});
	it('.description instanceof I18N despite being missing', () => {
		expect(group.description).toBeInstanceOf(I18N);
	});
	it('.label instanceof I18N', () => {
		expect(group.label).toBeInstanceOf(I18N);
	});
	it('.observedProperty is undefined', () => {
		expect(group.observedProperty).toBeUndefined();
	});
	it('.members is not undefined', () => {
		expect(group.members).toBeDefined();
	});
});

describe.skip('ObservedProperty', () => {});

describe('Category', () => {
	const cat = new Category({
		id: 'http://example.com/landcover/categories/grass',
		label: {
			en: 'Grass'
		},
		description: {
			en: 'Very green grass.'
		}
	});
	it('.toPlain returns plain object', () => {
		expect(cat.toPlain()).not.instanceOf(Category);
	});

	it('persistence', () => {
		cat.label.set('swa', 'some');
		cat.description.set('swa', 'some');
		expect(cat.toPlain().label).toEqual({ en: 'Grass', swa: 'some' });
		expect(cat.toPlain().description).toEqual({ en: 'Very green grass.', swa: 'some' });
	});
});

describe('Parameter', () => {
	const val: CoverageJSON.Parameter = {
		type: 'Parameter',
		description: {
			en: 'Land Cover according to xyz classification'
		},
		observedProperty: {
			id: 'http://example.com/landcover',
			label: {
				en: 'XYZ Land Cover'
			},
			categories: [
				{
					id: 'http://example.com/landcover/categories/grass',
					label: {
						en: 'Grass'
					},
					description: {
						en: 'Very green grass.'
					}
				},
				{
					id: 'http://example.com/landcover/categories/rocks',
					label: {
						en: 'Rock'
					},
					description: {
						en: 'Just rocks.'
					}
				}
			]
		},
		categoryEncoding: {
			'http://example.com/landcover/categories/grass': [0, 1],
			'http://example.com/landcover/categories/rocks': [2, 3]
		}
	};
	const pr = new Parameter(val, '');
	it('.toPlain returns the parameter as provided', () => {
		expect(pr.toPlain()).toMatchObject(val);
	});

	describe('.getCategory', () => {
		it('returns undefined for string args', () => {
			expect(pr.getCategory('')).toBeUndefined();
		});
		it('returns correct Category object for int', () => {
			expect(pr.getCategory(1)).toMatchObject({
				id: 'http://example.com/landcover/categories/grass'
			});
		});
	});
});
