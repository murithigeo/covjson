import { Exception } from './error.ts';
/**
 * Helper function to load CoverageJSON documents within this application
 * Expects resolved documents to be JSON
 */
export async function load<T>(url: string, abortController?: AbortController): Promise<T> {
	const res = await fetch(url, { signal: abortController?.signal });
	if(res.redirected)console.log(res)
	if (!res.ok) throw new Exception(res.status, res.url, res.statusText);
	const data = await res.json();
	return data;
}
