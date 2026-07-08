import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const crs = Object.entries(
	import.meta.glob('../example-data/spatialreference-org/**/*.txt', {
		import: 'default',
		eager: true,
		query: '?raw'
	})
).reduce(
	(l: Record<string, string>, [path, content]) => ({
		...l,
		[path.replace('../example-data/spatialreference-org/', '').slice(0, -4)]: content as string
	}),
	{}
);

const covjson = Object.entries(
	import.meta.glob('../example-data/playground/coverages/**/*.covjson', {
		eager: true,
		import: 'default',
		query: '?raw'
	})
).reduce(
	(l: Record<string, object>, [path, content]) => ({
		...l,
		[path.replace('../example-data', '')]: JSON.parse(content as string)
	}),
	{}
);
const handlers = [
	http.get('https://murithigei=o.org/playground/*', ({ request }) => {
		const file = covjson[request.url.replace('https://covjson.org', '')];
		console.log(request.url)
		if (file) return HttpResponse.json(file);

		return new HttpResponse(undefined, { status: 404 });
	}),
	http.get<{ auth: string; code: string }>(
		'https://spatialreference.org/ref/:auth/:code/prettywkt2.txt',
		({ params }) => {
			const { auth, code } = params;
			const def = crs[auth + '-' + code];
			if (!def) return new HttpResponse(null, { status: 404 });
			return HttpResponse.text(def);
		}
	)
];
export const server = setupServer(...handlers);
