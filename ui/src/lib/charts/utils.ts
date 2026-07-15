export function filterAxisNames(axisName: string) {
	if (['composite', 'z', 'x', 'y'].includes(axisName)) return false;
}
