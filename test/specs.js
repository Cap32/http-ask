
import assert from 'assert';
import { request } from '../src';

export default (host) => {
	describe('request.fetch', () => {
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

	describe('responseType', function () {
		it('responseType: json', async () => {
			const body = await request.fetch(`${host}/ok`, { responseType: 'json' });
			assert.deepEqual(body, { method: 'GET' });
		});

		it('responseType: text', async () => {
			const body = await request.fetch(`${host}/text`, { responseType: 'text' });
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
			const client = request({ url: `${host}/ok`, responseType: 'json', method: 'PUT' });
			const { url, method, responseType } = client.req;
			assert(url[0] === `${host}/ok`);
			assert(method === 'PUT');
			assert(responseType === 'json');
		});

		it('constructor() with url and options', async () => {
			const client = request(`${host}/ok`, { responseType: 'json', method: 'PUT' });
			const { url, method, responseType } = client.req;
			assert(url[0] === `${host}/ok`);
			assert(method === 'PUT');
			assert(responseType === 'json');
		});

		it('constructor() with another client', async () => {
			const baseClient = request({ responseType: 'json', method: 'PUT' });
			const client = request(baseClient);
			const { method, responseType } = client.req;
			assert(method === 'PUT');
			assert(responseType === 'json');
		});

		it('constructor() with options override', async () => {
			const baseClient = request({ responseType: 'json', method: 'PUT' });
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
			const options = await client.compose();
			assert(options.method === method);
			assert(options.url === `${url}?hello=world`);
		});

		it('client.fetch()', async () => {
			const client = request(`${host}/ok`, { responseType: 'json', method: 'POST' });
			const body = await client.fetch();
			assert.deepEqual(body, { method: 'POST' });
		});

		it('client.fetch() options override original options', async () => {
			const client = request(`${host}/ok`, { responseType: 'json', method: 'GET' });
			const body = await client.fetch({ method: 'POST' });
			assert.deepEqual(body, { method: 'POST' });
		});

		it('client.fetch() multiple times', async () => {
			const client = request(`${host}/ok`, { responseType: 'json', method: 'GET' });
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
		it('url string', async () => {
			const url = `${host}/foo/bar`;
			const client = request({ url });
			const composed = await client.compose();
			assert(composed.url === url);
		});

		it('extends url', async () => {
			const client = request({ url: host }).set('url', '/foo/bar');
			const composed = await client.compose();
			assert(composed.url === `${host}/foo/bar`);
		});

		it('override url', async () => {
			const client = request({ url: 'http://google.com' })
				.set('url', host)
				.set('url', '/foo/bar')
			;
			const composed = await client.compose();
			assert(composed.url === `${host}/foo/bar`);
		});

		it('resolve url', async () => {
			const client = request({ url: host })
				.set('url', '/foo/bar/')
				.set('url', '../baz')
			;
			const composed = await client.compose();
			assert(composed.url === `${host}/foo/baz`);
		});

		it('modify url', async () => {
			const client = request({ url: host })
				.set('url', (urls) => urls.concat('/foo/bar'))
			;
			const composed = await client.compose();
			assert(composed.url === `${host}/foo/bar`);
		});
	});

	describe('query', function () {
		const url = 'http://localhost';

		it('query object', async () => {
			const client = request(url, { query: { hello: 'world' } });
			const composed = await client.compose();
			const composedUrl = composed.url;
			assert(composedUrl === `${url}?hello=world`);
		});

		it('query string', async () => {
			const client = request(url, { query: 'hello=world' });
			const composed = await client.compose();
			const composedUrl = composed.url;
			assert(composedUrl === `${url}?hello=world`);
		});

		it('query mixed', async () => {
			const client = request(url, { query: 'hello=world' })
				.set('query', { it: 'works' })
			;
			const composed = await client.compose();
			const composedUrl = composed.url;
			assert(
				composedUrl === `${url}?hello=world&it=works` ||
				composedUrl === `${url}?it=works&hello=world`
			);
		});

		it('modify query', async () => {
			const client = request(url, { query: 'hello=world' })
				.set('query', () => [{ hello: 'chris' }])
			;
			const composed = await client.compose();
			const composedUrl = composed.url;
			assert(composedUrl === `${url}?hello=chris`);
		});
	});

	describe('headers', function () {
		const url = 'http://localhost';

		it('headers', async () => {
			const client = request(url, { headers: { hello: 'world' } });
			const composed = await client.compose();
			const { headers } = composed;
			assert.deepEqual(headers, { hello: 'world' });
		});

		it('extends headers', async () => {
			const client = request(url, { headers: { hello: 'world' } })
				.set('headers', { it: 'works' })
			;
			const composed = await client.compose();
			const { headers } = composed;
			assert.deepEqual(headers, { hello: 'world', it: 'works' });
		});

		it('override headers', async () => {
			const client = request(url, { headers: { hello: 'world' } })
				.set('headers', { hello: 'chris' })
			;
			const composed = await client.compose();
			const { headers } = composed;
			assert.deepEqual(headers, { hello: 'chris' });
		});

		it('modify headers', async () => {
			const client = request(url, { headers: { hello: 'world' } })
				.set('headers', (headers) => {
					headers.hello = 'chris';
					headers.it = 'works';
					return headers;
				})
			;
			const composed = await client.compose();
			const { headers } = composed;
			assert.deepEqual(headers, { hello: 'chris', it: 'works' });
		});

		it('headers with type: json', async () => {
			const client = request(url, { headers: { hello: 'world' }, type: 'json' });
			const composed = await client.compose();
			const { headers } = composed;
			assert.deepEqual(headers, {
				hello: 'world',
				'Content-Type': 'application/json',
			});
		});

		it('headers with type: form', async () => {
			const client = request(url, { headers: { hello: 'world' }, type: 'form' });
			const composed = await client.compose();
			const { headers } = composed;
			assert.deepEqual(headers, {
				hello: 'world',
				'Content-Type': 'application/x-www-form-urlencoded',
			});
		});
	});

	describe('body', function () {
		const url = 'http://localhost';

		it('body', async () => {
			const client = request(url, { body: { hello: 'world' } });
			const composed = await client.compose();
			const { body } = composed;
			assert.deepEqual(body, { hello: 'world' });
		});

		it('extends body', async () => {
			const client = request(url, { body: { hello: 'world' } })
				.set('body', { it: 'works' })
			;
			const composed = await client.compose();
			const { body } = composed;
			assert.deepEqual(body, { hello: 'world', it: 'works' });
		});

		it('override body', async () => {
			const client = request(url, { body: { hello: 'world' } })
				.set('body', { hello: 'chris' })
			;
			const composed = await client.compose();
			const { body } = composed;
			assert.deepEqual(body, { hello: 'chris' });
		});

		it('modify body', async () => {
			const client = request(url, { body: { hello: 'world' } })
				.set('body', (body) => {
					body.hello = 'chris';
					body.it = 'works';
					return body;
				})
			;
			const composed = await client.compose();
			const { body } = composed;
			assert.deepEqual(body, { hello: 'chris', it: 'works' });
		});

		it('body with type: json', async () => {
			const client = request(url, { body: { hello: 'world' }, type: 'json' });
			const composed = await client.compose();
			const { body } = composed;
			assert(body === JSON.stringify({ hello: 'world' }));
		});

		it('body with type: form', async () => {
			const client = request(url, { body: { hello: 'world' }, type: 'form' });
			const composed = await client.compose();
			const { body } = composed;
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
		it('should throw error if missing url', async () => {
			return request
				.fetch()
				.then(() => assert(false))
				.catch(assert)
			;
		});

		it('should throw error if fetch failed', async () => {
			return request
				.fetch('http://localhost:1')
				.then(() => assert(false))
				// .catch((err) => assert(err.name === 'FetchError', err.message))
				.catch((err) => assert(err))
			;
		});

		it('should throw error if transformer failed', async () => {
			const message = 'Failed to transform url';
			return request
				.fetch({
					url: `${host}/ok`,
					urlTransformer: () => { throw new Error(message); }
				})
				.then(() => assert(false))
				.catch((err) => assert(err.message === message))
			;
		});

		it('simple option', async () => {
			return request
				.fetch(`${host}/404`, { simple: true })
				.then(() => assert(false))
				.catch((err) => assert(err.status === 404))
			;
		});
	});

	describe('transformers', function () {

		describe('url transformer', function () {
			it('urlTransformer option', async () => {
				const client = request({
					url: `${host}/foo/bar`,
					urlTransformer: (url) => url + '/baz',
				});
				const composed = await client.compose();
				assert(composed.url === `${host}/foo/bar/baz`);
			});

			it('addUrlTransformer', async () => {
				const client = request({ url: `${host}/foo/bar` });
				client.addUrlTransformer((url) => url + '/baz');
				const composed = await client.compose();
				assert(composed.url === `${host}/foo/bar/baz`);
			});
		});

		describe('body transformer', function () {
			it('bodyTransformer option', async () => {
				const client = request({
					url: 'http://localhost',
					body: { hello: 'world' },
					bodyTransformer: (body) => Object.assign(body, { it: 'works' })
				});
				const composed = await client.compose();
				assert.deepEqual(composed.body, { hello: 'world', it: 'works' });
			});

			it('addBodyTransformer', async () => {
				const client = request('http://localhost', { body: { hello: 'world' } });
				client.addBodyTransformer((body) => Object.assign(body, {
					it: 'works',
				}));
				const composed = await client.compose();
				assert.deepEqual(composed.body, { hello: 'world', it: 'works' });
			});
		});

		describe('headers transformer', function () {
			it('headersTransformer option', async () => {
				const client = request({
					url: 'http://localhost',
					headers: { hello: 'world' },
					headersTransformer: (headers) => Object.assign(headers, { it: 'works', }),
				});
				const composed = await client.compose();
				assert.deepEqual(composed.headers, { hello: 'world', it: 'works' });
			});

			it('addHeadersTransformer', async () => {
				const client = request('http://localhost', { headers: { hello: 'world' } });
				client.addHeadersTransformer((headers) => Object.assign(headers, {
					it: 'works',
				}));
				const composed = await client.compose();
				assert.deepEqual(composed.headers, { hello: 'world', it: 'works' });
			});
		});

		describe('error transformer', function () {
			it('errorTransformer option', async () => {
				const client = request({
					url: 'http://localhost:1',
					errorTransformer: (err) => Object.assign(err, { name: 404 }),
				});
				return client
					.fetch()
					.then(() => assert(false))
					.catch((err) => assert(err.name === 404))
				;
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

		describe('response transformer', function () {
			it('responseTransformer option', async () => {
				const client = await request({
					url: `${host}/ok`,
					responseTransformer: (res) => Object.assign(res, { foo: 'bar' }),
				});
				const res = await client.fetch();
				assert(res.foo === 'bar');
			});

			it('addResponseTransformer', async () => {
				const client = await request(`${host}/ok`);
				client.addResponseTransformer(
					(res) => Object.assign(res, { foo: 'bar' }),
				);
				const res = await client.fetch();
				assert(res.foo === 'bar');
			});
		});

		describe('responseData transformer', function () {
			it('responseDataTransformer option', async () => {
				const client = await request({
					url: `${host}/ok`,
					responseType: 'json',
					responseDataTransformer: (json) => Object.assign(json, { foo: 'bar' }),
				});
				const json = await client.fetch();
				assert.deepEqual(json, { foo: 'bar', method: 'GET' });
			});

			it('addResponseDataTransformer', async () => {
				const client = await request(`${host}/ok`, { responseType: 'json' });
				client.addResponseDataTransformer((json) => Object.assign(json, { foo: 'bar' }));
				const json = await client.fetch();
				assert.deepEqual(json, { foo: 'bar', method: 'GET' });
			});
		});

		describe('transformer behaviours', function () {
			it('add multiple transformers', async () => {
				const client = request({ url: `${host}/foo/bar` });
				client.addUrlTransformer((url) => url + '/baz');
				client.addUrlTransformer((url) => url.replace('foo', 'qux'));
				const composed = await client.compose();
				assert(composed.url === `${host}/qux/bar/baz`);
			});

			it('remove transformer', async () => {
				const client = request({ url: `${host}/foo/bar` });
				const urlTransformer = (url) => url + '/baz';
				client.addUrlTransformer(urlTransformer);
				client.addUrlTransformer((url) => url.replace('foo', 'qux'));
				client.removeUrlTransformer(urlTransformer);
				const composed = await client.compose();
				assert(composed.url === `${host}/qux/bar`);
			});

			it('transformers should be able to inherit', async () => {
				const baseClient = request({ url: `${host}/foo/bar` });
				baseClient.addUrlTransformer((url) => url + '/baz');
				const client = request(baseClient);
				client.addUrlTransformer((url) => url.replace('foo', 'qux'));
				const composed = await client.compose();
				assert(composed.url === `${host}/qux/bar/baz`);
			});

			it('transformers should be isolated', async () => {
				const baseClient = request({ url: `${host}/foo/bar` });
				const urlTransformer = (url) => url + '/baz';
				baseClient.addUrlTransformer(urlTransformer);
				const client = request(baseClient);
				client.removeUrlTransformer(urlTransformer);
				client.addUrlTransformer((url) => url + '/quux');
				baseClient.addUrlTransformer((url) => url.replace('foo', 'qux'));
				const baseComposed = await baseClient.compose();
				assert(baseComposed.url === `${host}/qux/bar/baz`);
				const composed = await client.compose();
				assert(composed.url === `${host}/foo/bar/quux`);
			});
		});
	});
};
