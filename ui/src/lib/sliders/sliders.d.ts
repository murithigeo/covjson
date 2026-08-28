/**
 * First element is the current minimum
 * Second is the current slider value
 * Third is the current slider maximum
 */
export type SliderValue<T extends string | number> = [T, T, T];
export type SliderIndex = SliderValue<number>;
export type StringSliderValue = SliderValue<string>;
export type NumericSliderValue = SliderIndex;
