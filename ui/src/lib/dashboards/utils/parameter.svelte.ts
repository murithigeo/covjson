import { getRandomColor } from '$lib/utils.js';
import { Parameter, Category, ObservedProperty, Unit } from '@murithigeo/covjson-core';

class ParameterState {
	/**
	 * Doubles as the initial color for categories
	 */
	color = $state(getRandomColor());
}

class CategoryState extends Category {
	color = $state<string>();
	values: number[];
	constructor(cat: Category, initialColor: string, values: number | number[]) {
		super(cat.toPlain());
		this.color = initialColor;
		this.values = Array.isArray(values) ? values : [values];
	}

	setColor(color: string) {
		this.color = color;
	}
}

class UnitState extends Unit {
	format(value: number) {
		if (!this.symbol?.value) return value;
		return value.toString() + this.symbol.value;
	}
}
