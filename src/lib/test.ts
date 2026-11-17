import { Coverage } from './core/index.ts';

const cov = await Coverage.load('https://covjson.org/playground/coverages/grid-tiled.covjson');

console.log(cov.rangeIds);
