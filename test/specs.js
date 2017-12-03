
import assert from 'assert';
import f from '../src';

export default (host) => {
	describe('fetch', () => {
		it('f.etch(url)', async () => f.etch(`${host}/ok`));

		it('f.fetch(url)', async () => f.etch(`${host}/ok`));

		it('response', async () => {
			const response = await f.etch(`${host}/ok`);
			const json = await response.json();
			assert.deepEqual(json, { method: 'GET' });
		});

		it('method: POST', async () => {
			const res = await f.etch(`${host}/ok`, { method: 'POST' });
			const json = await res.json();
			assert.deepEqual(json, { method: 'POST' });
		});

		it('method: PUT', async () => {
			const res = await f.etch(`${host}/ok`, { method: 'PUT' });
			const json = await res.json();
			assert.deepEqual(json, { method: 'PUT' });
		});

		it('method: PATCH', async () => {
			const res = await f.etch(`${host}/ok`, { method: 'PATCH' });
			const json = await res.json();
			assert.deepEqual(json, { method: 'PATCH' });
		});

		it('method: DELETE', async () => {
			const res = await f.etch(`${host}/ok`, { method: 'DELETE' });
			const json = await res.json();
			assert.deepEqual(json, { method: 'DELETE' });
		});
	});

	describe('resolveWith', function () {
		it('resolveWith: json', async () => {
			const body = await f.etch(`${host}/ok`, { resolveWith: 'json' });
			assert.deepEqual(body, { method: 'GET' });
		});

		it('resolveWith: text', async () => {
			const body = await f.etch(`${host}/text`, { resolveWith: 'text' });
			assert.equal(body, 'ok');
		});
	});

	describe('client constructor', function () {
		it('constructor()', async () => {
			const client = f();
			assert(client instanceof f);
		});

		it('constructor() with url', async () => {
			const client = f(`${host}/ok`);
			const { url } = client.req;
			assert(url[0] === `${host}/ok`);
		});

		it('constructor() with options', async () => {
			const client = f({ url: `${host}/ok`, resolveWith: 'json', method: 'PUT' });
			const { url, method, resolveWith } = client.req;
			assert(url[0] === `${host}/ok`);
			assert(method === 'PUT');
			assert(resolveWith === 'json');
		});

		it('constructor() with url and options', async () => {
			const client = f(`${host}/ok`, { resolveWith: 'json', method: 'PUT' });
			const { url, method, resolveWith } = client.req;
			assert(url[0] === `${host}/ok`);
			assert(method === 'PUT');
			assert(resolveWith === 'json');
		});

		it('constructor() with another client', async () => {
			const baseClient = f({ resolveWith: 'json', method: 'PUT' });
			const client = f(baseClient);
			const { method, resolveWith } = client.req;
			assert(method === 'PUT');
			assert(resolveWith === 'json');
		});

		it('constructor() with options override', async () => {
			const baseClient = f({ resolveWith: 'json', method: 'PUT' });
			const client = f({ method: 'POST' }, baseClient);
			const { method } = client.req;
			assert(method === 'PUT');
		});
	});

	describe('client props', function () {
		it('client.req', async () => {
			const client = f();
			const { url, query, body, headers, method } = client.req;
			assert(method === 'GET');
			assert.deepEqual(headers, {});
			assert.deepEqual(body, {});
			assert(Array.isArray(query));
			assert(Array.isArray(url));
		});

		it('client.compose()', async () => {
			const url = `${host}/ok`;
			const method = 'POST';
			const query = { hello: 'world' };
			const client = f({ url, method, query });
			const options = client.compose();
			assert(options.method === method);
			assert(options.url === `${url}?hello=world`);
		});

		it('client.fetch()', async () => {
			const client = f(`${host}/ok`, { resolveWith: 'json', method: 'POST' });
			const body = await client.fetch();
			assert.deepEqual(body, { method: 'POST' });
		});

		it('client.etch()', async () => {
			const client = f(`${host}/ok`, { resolveWith: 'json', method: 'POST' });
			const body = await client.fetch();
			assert.deepEqual(body, { method: 'POST' });
		});

		it('client.fetch() options override original options', async () => {
			const client = f(`${host}/ok`, { resolveWith: 'json', method: 'GET' });
			const body = await client.fetch({ method: 'POST' });
			assert.deepEqual(body, { method: 'POST' });
		});

		it('client.fetch() multiple times', async () => {
			const client = f(`${host}/ok`, { resolveWith: 'json', method: 'GET' });
			const body1 = await client.fetch({ method: 'POST' });
			assert.deepEqual(body1, { method: 'POST' });
			const body2 = await client.fetch();
			assert.deepEqual(body2, { method: 'GET' });
		});

		it('client.set() with key and value', async () => {
			const client = f().set('method', 'POST');
			const { method } = client.req;
			assert(method === 'POST');
		});

		it('client.set() with object', async () => {
			const client = f().set({ method: 'POST' });
			const { method } = client.req;
			assert(method === 'POST');
		});

		it('client.set() with another client', async () => {
			const baseClient = f({ method: 'POST' });
			const client = f().set(baseClient);
			const { method } = client.req;
			assert(method === 'POST');
		});

		it('client.clone()', async () => {
			const client = f({ method: 'POST' });
			const cloned = client.clone();
			assert(cloned instanceof f);
			assert(cloned.req.method === 'POST');
			client.set('method', 'DELETE');
			assert(cloned.req.method === 'POST');
		});
	});

	describe('query', function () {
		it('query object', async () => {
			const body = await f.etch(`${host}/query`, {
				resolveWith: 'json',
				query: { hello: 'world' },
			});
			assert.deepEqual(body, { hello: 'world' });
		});

		it('query string', async () => {
			const body = await f.etch(`${host}/query`, {
				resolveWith: 'json',
				query: 'hello=world',
			});
			assert.deepEqual(body, { hello: 'world' });
		});

		it('query mixed', async () => {
			const baseF = f(`${host}/query`, {
				resolveWith: 'json',
				query: 'hello=world',
			});
			const body = await baseF.etch({ query: 'it=works' });
			assert.deepEqual(body, { hello: 'world', it: 'works' });
		});
	});

	describe('url', function () {
		it('url string', async () => {
			const body = await f.etch({ url: `${host}/foo/bar`, resolveWith: 'json' });
			assert.deepEqual(body, { pathname: '/foo/bar' });
		});

		it('extends url', async () => {
			const client = f({ url: host, resolveWith: 'json' });
			const body = await client.etch({ url: '/foo/bar' });
			assert.deepEqual(body, { pathname: '/foo/bar' });
		});

		// it('override url', async () => {
		// 	const client = f({ url: 'http://google.com', resolveWith: 'json' });
		// 	const body = await client.etch({ url: `${host}/foo/bar` });
		// 	assert.deepEqual(body, { pathname: '/foo/bar' });
		// });
	});
};
