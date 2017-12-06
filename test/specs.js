
import assert from 'assert';
import { request } from '../src';

export default (host) => {
	describe('request', () => {
		it('should throw error if missing url', async () => {
			return request
				.fetch()
				.then(() => assert(false))
				.catch(assert)
			;
		});

		it('request.fetch(url)', async () => request.fetch(`${host}/ok`));

		it('response', async () => {
			const response = await request.fetch(`${host}/ok`);
			const json = await response.json();
			assert.deepEqual(json, { method: 'GET' });
		});

		it('method: POST', async () => {
			const res = await request.fetch(`${host}/ok`, { method: 'POST' });
			const json = await res.json();
			assert.deepEqual(json, { method: 'POST' });
		});

		it('method: PUT', async () => {
			const res = await request.fetch(`${host}/ok`, { method: 'PUT' });
			const json = await res.json();
			assert.deepEqual(json, { method: 'PUT' });
		});

		it('method: PATCH', async () => {
			const res = await request.fetch(`${host}/ok`, { method: 'PATCH' });
			const json = await res.json();
			assert.deepEqual(json, { method: 'PATCH' });
		});

		it('method: DELETE', async () => {
			const res = await request.fetch(`${host}/ok`, { method: 'DELETE' });
			const json = await res.json();
			assert.deepEqual(json, { method: 'DELETE' });
		});
	});

	describe('resolveWith', function () {
		it('resolveWith: json', async () => {
			const body = await request.fetch(`${host}/ok`, { resolveWith: 'json' });
			assert.deepEqual(body, { method: 'GET' });
		});

		it('resolveWith: text', async () => {
			const body = await request.fetch(`${host}/text`, { resolveWith: 'text' });
			assert.equal(body, 'ok');
		});
	});

	describe('client constructor', function () {
		it('constructor()', async () => {
			const client = request();
			assert(client instanceof request);
		});

		it('constructor() with url', async () => {
			const client = request(`${host}/ok`);
			const { url } = client.req;
			assert(url[0] === `${host}/ok`);
		});

		it('constructor() with options', async () => {
			const client = request({ url: `${host}/ok`, resolveWith: 'json', method: 'PUT' });
			const { url, method, resolveWith } = client.req;
			assert(url[0] === `${host}/ok`);
			assert(method === 'PUT');
			assert(resolveWith === 'json');
		});

		it('constructor() with url and options', async () => {
			const client = request(`${host}/ok`, { resolveWith: 'json', method: 'PUT' });
			const { url, method, resolveWith } = client.req;
			assert(url[0] === `${host}/ok`);
			assert(method === 'PUT');
			assert(resolveWith === 'json');
		});

		it('constructor() with another client', async () => {
			const baseClient = request({ resolveWith: 'json', method: 'PUT' });
			const client = request(baseClient);
			const { method, resolveWith } = client.req;
			assert(method === 'PUT');
			assert(resolveWith === 'json');
		});

		it('constructor() with options override', async () => {
			const baseClient = request({ resolveWith: 'json', method: 'PUT' });
			const client = request({ method: 'POST' }, baseClient);
			const { method } = client.req;
			assert(method === 'PUT');
		});
	});

	describe('client props', function () {
		it('client.req', async () => {
			const client = request();
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
			const client = request({ url, method, query });
			const options = client.compose();
			assert(options.method === method);
			assert(options.url === `${url}?hello=world`);
		});

		it('client.fetch()', async () => {
			const client = request(`${host}/ok`, { resolveWith: 'json', method: 'POST' });
			const body = await client.fetch();
			assert.deepEqual(body, { method: 'POST' });
		});

		it('client.fetch()', async () => {
			const client = request(`${host}/ok`, { resolveWith: 'json', method: 'POST' });
			const body = await client.fetch();
			assert.deepEqual(body, { method: 'POST' });
		});

		it('client.fetch() options override original options', async () => {
			const client = request(`${host}/ok`, { resolveWith: 'json', method: 'GET' });
			const body = await client.fetch({ method: 'POST' });
			assert.deepEqual(body, { method: 'POST' });
		});

		it('client.fetch() multiple times', async () => {
			const client = request(`${host}/ok`, { resolveWith: 'json', method: 'GET' });
			const body1 = await client.fetch({ method: 'POST' });
			assert.deepEqual(body1, { method: 'POST' });
			const body2 = await client.fetch();
			assert.deepEqual(body2, { method: 'GET' });
		});

		it('client.set() with key and value', async () => {
			const client = request().set('method', 'POST');
			const { method } = client.req;
			assert(method === 'POST');
		});

		it('client.set() with object', async () => {
			const client = request().set({ method: 'POST' });
			const { method } = client.req;
			assert(method === 'POST');
		});

		it('client.set() with another client', async () => {
			const baseClient = request({ method: 'POST' });
			const client = request().set(baseClient);
			const { method } = client.req;
			assert(method === 'POST');
		});

		it('client.clone()', async () => {
			const client = request({ method: 'POST' });
			const cloned = client.clone();
			assert(cloned instanceof request);
			assert(cloned.req.method === 'POST');
			client.set('method', 'DELETE');
			assert(cloned.req.method === 'POST');
		});
	});

	describe('url', function () {
		it('url string', () => {
			const url = `${host}/foo/bar`;
			const client = request({ url });
			assert(client.compose().url === url);
		});

		it('extends url', () => {
			const client = request({ url: host }).set('url', '/foo/bar');
			assert(client.compose().url === `${host}/foo/bar`);
		});

		it('override url', () => {
			const client = request({ url: 'http://google.com' })
				.set('url', host)
				.set('url', '/foo/bar')
			;
			assert(client.compose().url === `${host}/foo/bar`);
		});

		it('resolve url', () => {
			const client = request({ url: host })
				.set('url', '/foo/bar/')
				.set('url', '../baz')
			;
			assert(client.compose().url === `${host}/foo/baz`);
		});

		it('modify url', () => {
			const client = request({ url: host })
				.set('url', (urls) => urls.concat('/foo/bar'))
			;
			assert(client.compose().url === `${host}/foo/bar`);
		});
	});

	describe('query', function () {
		const url = 'http://localhost';

		it('query object', () => {
			const client = request(url, { query: { hello: 'world' } });
			const composedUrl = client.compose().url;
			assert(composedUrl === `${url}?hello=world`);
		});

		it('query string', () => {
			const client = request(url, { query: 'hello=world' });
			const composedUrl = client.compose().url;
			assert(composedUrl === `${url}?hello=world`);
		});

		it('query mixed', async () => {
			const client = request(url, { query: 'hello=world' })
				.set('query', { it: 'works' })
			;
			const composedUrl = client.compose().url;
			assert(
				composedUrl === `${url}?hello=world&it=works` ||
				composedUrl === `${url}?it=works&hello=world`
			);
		});

		it('modify query', () => {
			const client = request(url, { query: 'hello=world' })
				.set('query', () => [{ hello: 'chris' }])
			;
			const composedUrl = client.compose().url;
			assert(composedUrl === `${url}?hello=chris`);
		});
	});

	describe('headers', function () {
		const url = 'http://localhost';

		it('headers', () => {
			const client = request(url, { headers: { hello: 'world' } });
			const { headers } = client.compose();
			assert.deepEqual(headers, { hello: 'world' });
		});

		it('extends headers', () => {
			const client = request(url, { headers: { hello: 'world' } })
				.set('headers', { it: 'works' })
			;
			const { headers } = client.compose();
			assert.deepEqual(headers, { hello: 'world', it: 'works' });
		});

		it('override headers', () => {
			const client = request(url, { headers: { hello: 'world' } })
				.set('headers', { hello: 'chris' })
			;
			const { headers } = client.compose();
			assert.deepEqual(headers, { hello: 'chris' });
		});

		it('modify headers', () => {
			const client = request(url, { headers: { hello: 'world' } })
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
			const client = request(url, { headers: { hello: 'world' }, type: 'json' });
			const { headers } = client.compose();
			assert.deepEqual(headers, {
				hello: 'world',
				'Content-Type': 'application/json',
			});
		});

		it('headers with type: form', () => {
			const client = request(url, { headers: { hello: 'world' }, type: 'form' });
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
			const client = request(url, { body: { hello: 'world' } });
			const { body } = client.compose();
			assert.deepEqual(body, { hello: 'world' });
		});

		it('extends body', () => {
			const client = request(url, { body: { hello: 'world' } })
				.set('body', { it: 'works' })
			;
			const { body } = client.compose();
			assert.deepEqual(body, { hello: 'world', it: 'works' });
		});

		it('override body', () => {
			const client = request(url, { body: { hello: 'world' } })
				.set('body', { hello: 'chris' })
			;
			const { body } = client.compose();
			assert.deepEqual(body, { hello: 'chris' });
		});

		it('modify body', () => {
			const client = request(url, { body: { hello: 'world' } })
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
			const client = request(url, { body: { hello: 'world' }, type: 'json' });
			const { body } = client.compose();
			assert(body === JSON.stringify({ hello: 'world' }));
		});

		it('body with type: form', () => {
			const client = request(url, { body: { hello: 'world' }, type: 'form' });
			const { body } = client.compose();
			assert(body === 'hello=world');
		});
	});

	describe('timeout', function () {
		it('should timeout', async () => {
			return request
				.fetch(`${host}/delay`, { timeout: 1 })
				.then(() => assert(false))
				.catch(() => assert(true))
			;
		});
	});

	describe('error', function () {
		it('request error', async () => {
			return request
				.fetch('http://localhost:1')
				.then(() => assert(false))
				.catch((err) => assert(err.name === 'FetchError'))
			;
		});
	});

	describe('transformers', function () {
		it('addUrlTransformer', () => {
			const client = request({ url: `${host}/foo/bar` });
			client.addUrlTransformer((url) => url + '/baz');
			assert(client.compose().url === `${host}/foo/bar/baz`);
		});

		it('addBodyTransformer', () => {
			const client = request('http://localhost', { body: { hello: 'world' } });
			client.addBodyTransformer((body) => Object.assign(body, {
				it: 'works',
			}));
			const { body } = client.compose();
			assert.deepEqual(body, { hello: 'world', it: 'works' });
		});

		it('addHeadersTransformer', () => {
			const client = request('http://localhost', { headers: { hello: 'world' } });
			client.addHeadersTransformer((headers) => Object.assign(headers, {
				it: 'works',
			}));
			const { headers } = client.compose();
			assert.deepEqual(headers, { hello: 'world', it: 'works' });
		});

		it('add multiple transformers', () => {
			const client = request({ url: `${host}/foo/bar` });
			client.addUrlTransformer((url) => url + '/baz');
			client.addUrlTransformer((url) => url.replace('foo', 'qux'));
			assert(client.compose().url === `${host}/qux/bar/baz`);
		});

		it('remove transformer', () => {
			const client = request({ url: `${host}/foo/bar` });
			const urlTransformer = (url) => url + '/baz';
			client.addUrlTransformer(urlTransformer);
			client.addUrlTransformer((url) => url.replace('foo', 'qux'));
			client.removeUrlTransformer(urlTransformer);
			assert(client.compose().url === `${host}/qux/bar`);
		});

		it('transformers should be able to inherit', () => {
			const baseClient = request({ url: `${host}/foo/bar` });
			baseClient.addUrlTransformer((url) => url + '/baz');
			const client = request(baseClient);
			client.addUrlTransformer((url) => url.replace('foo', 'qux'));
			assert(client.compose().url === `${host}/qux/bar/baz`);
		});

		it('transformers should be isolated', () => {
			const baseClient = request({ url: `${host}/foo/bar` });
			const urlTransformer = (url) => url + '/baz';
			baseClient.addUrlTransformer(urlTransformer);
			const client = request(baseClient);
			client.removeUrlTransformer(urlTransformer);
			client.addUrlTransformer((url) => url + '/quux');
			baseClient.addUrlTransformer((url) => url.replace('foo', 'qux'));
			assert(baseClient.compose().url === `${host}/qux/bar/baz`);
			assert(client.compose().url === `${host}/foo/bar/quux`);
		});

		it('addErrorTransformer', async () => {
			const client = request('http://localhost:1');
			client.addErrorTransformer((err) => Object.assign(err, { name: 404 }));
			return client
				.fetch()
				.then(() => assert(false))
				.catch((err) => assert(err.name === 404))
			;
		});
	});
};
