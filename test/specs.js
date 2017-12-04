
import assert from 'assert';
import f from '../src';

export default (host) => {
	describe('fetch', () => {
		it('should throw error if missing url', async () => {
			return f
				.fetch()
				.then(() => assert(false))
				.catch(assert)
			;
		});

		it('f.fetch(url)', async () => f.fetch(`${host}/ok`));

		it('response', async () => {
			const response = await f.fetch(`${host}/ok`);
			const json = await response.json();
			assert.deepEqual(json, { method: 'GET' });
		});

		it('method: POST', async () => {
			const res = await f.fetch(`${host}/ok`, { method: 'POST' });
			const json = await res.json();
			assert.deepEqual(json, { method: 'POST' });
		});

		it('method: PUT', async () => {
			const res = await f.fetch(`${host}/ok`, { method: 'PUT' });
			const json = await res.json();
			assert.deepEqual(json, { method: 'PUT' });
		});

		it('method: PATCH', async () => {
			const res = await f.fetch(`${host}/ok`, { method: 'PATCH' });
			const json = await res.json();
			assert.deepEqual(json, { method: 'PATCH' });
		});

		it('method: DELETE', async () => {
			const res = await f.fetch(`${host}/ok`, { method: 'DELETE' });
			const json = await res.json();
			assert.deepEqual(json, { method: 'DELETE' });
		});
	});

	describe('resolveWith', function () {
		it('resolveWith: json', async () => {
			const body = await f.fetch(`${host}/ok`, { resolveWith: 'json' });
			assert.deepEqual(body, { method: 'GET' });
		});

		it('resolveWith: text', async () => {
			const body = await f.fetch(`${host}/text`, { resolveWith: 'text' });
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

		it('client.fetch()', async () => {
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

	describe('url', function () {
		it('url string', () => {
			const url = `${host}/foo/bar`;
			const client = f({ url });
			assert(client.compose().url === url);
		});

		it('extends url', () => {
			const client = f({ url: host }).set('url', '/foo/bar');
			assert(client.compose().url === `${host}/foo/bar`);
		});

		it('override url', () => {
			const client = f({ url: 'http://google.com' })
				.set('url', host)
				.set('url', '/foo/bar')
			;
			assert(client.compose().url === `${host}/foo/bar`);
		});

		it('resolve url', () => {
			const client = f({ url: host })
				.set('url', '/foo/bar/')
				.set('url', '../baz')
			;
			assert(client.compose().url === `${host}/foo/baz`);
		});

		it('modify url', () => {
			const client = f({ url: host })
				.set('url', (urls) => urls.concat('/foo/bar'))
			;
			assert(client.compose().url === `${host}/foo/bar`);
		});
	});

	describe('query', function () {
		const url = 'http://localhost';

		it('query object', () => {
			const client = f(url, { query: { hello: 'world' } });
			const composedUrl = client.compose().url;
			assert(composedUrl === `${url}?hello=world`);
		});

		it('query string', () => {
			const client = f(url, { query: 'hello=world' });
			const composedUrl = client.compose().url;
			assert(composedUrl === `${url}?hello=world`);
		});

		it('query mixed', async () => {
			const client = f(url, { query: 'hello=world' })
				.set('query', { it: 'works' })
			;
			const composedUrl = client.compose().url;
			assert(
				composedUrl === `${url}?hello=world&it=works` ||
				composedUrl === `${url}?it=works&hello=world`
			);
		});

		it('modify query', () => {
			const client = f(url, { query: 'hello=world' })
				.set('query', () => [{ hello: 'chris' }])
			;
			const composedUrl = client.compose().url;
			assert(composedUrl === `${url}?hello=chris`);
		});
	});

	describe('headers', function () {
		const url = 'http://localhost';

		it('headers', () => {
			const client = f(url, { headers: { hello: 'world' } });
			const { headers } = client.compose();
			assert.deepEqual(headers, { hello: 'world' });
		});

		it('extends headers', () => {
			const client = f(url, { headers: { hello: 'world' } })
				.set('headers', { it: 'works' })
			;
			const { headers } = client.compose();
			assert.deepEqual(headers, { hello: 'world', it: 'works' });
		});

		it('override headers', () => {
			const client = f(url, { headers: { hello: 'world' } })
				.set('headers', { hello: 'chris' })
			;
			const { headers } = client.compose();
			assert.deepEqual(headers, { hello: 'chris' });
		});

		it('modify headers', () => {
			const client = f(url, { headers: { hello: 'world' } })
				.set('headers', (headers) => {
					headers.hello = 'chris';
					headers.it = 'works';
					return headers;
				})
			;
			const { headers } = client.compose();
			assert.deepEqual(headers, { hello: 'chris', it: 'works' });
		});

		it('headers with type: json', () => {
			const client = f(url, { headers: { hello: 'world' }, type: 'json' });
			const { headers } = client.compose();
			assert.deepEqual(headers, {
				hello: 'world',
				'Content-Type': 'application/json',
			});
		});

		it('headers with type: form', () => {
			const client = f(url, { headers: { hello: 'world' }, type: 'form' });
			const { headers } = client.compose();
			assert.deepEqual(headers, {
				hello: 'world',
				'Content-Type': 'application/x-www-form-urlencoded',
			});
		});
	});

	describe('body', function () {
		const url = 'http://localhost';

		it('body', () => {
			const client = f(url, { body: { hello: 'world' } });
			const { body } = client.compose();
			assert.deepEqual(body, { hello: 'world' });
		});

		it('extends body', () => {
			const client = f(url, { body: { hello: 'world' } })
				.set('body', { it: 'works' })
			;
			const { body } = client.compose();
			assert.deepEqual(body, { hello: 'world', it: 'works' });
		});

		it('override body', () => {
			const client = f(url, { body: { hello: 'world' } })
				.set('body', { hello: 'chris' })
			;
			const { body } = client.compose();
			assert.deepEqual(body, { hello: 'chris' });
		});

		it('modify body', () => {
			const client = f(url, { body: { hello: 'world' } })
				.set('body', (body) => {
					body.hello = 'chris';
					body.it = 'works';
					return body;
				})
			;
			const { body } = client.compose();
			assert.deepEqual(body, { hello: 'chris', it: 'works' });
		});

		it('body with type: json', () => {
			const client = f(url, { body: { hello: 'world' }, type: 'json' });
			const { body } = client.compose();
			assert(body === JSON.stringify({ hello: 'world' }));
		});

		it('body with type: form', () => {
			const client = f(url, { body: { hello: 'world' }, type: 'form' });
			const { body } = client.compose();
			assert(body === 'hello=world');
		});
	});

	describe('timeout', function () {
		it('should timeout', async () => {
			return f
				.fetch(`${host}/delay`, { timeout: 1 })
				.then(() => assert(false))
				.catch((err) => {
					assert(err.name === 'TimeoutError');
				})
			;
		});
	});
};
