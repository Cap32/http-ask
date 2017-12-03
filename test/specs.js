
import assert from 'assert';
import f from '../src';

export default (host) => {
	describe('fetch', () => {
		it('f.etch(url)', async () => f.etch(`${host}/ok`));

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
};
