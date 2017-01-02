
import assert from 'assert';
import Ask, { Cancellation } from '../src';

export default (host) => {

	it('get(url)', () => Ask.create().get(`${host}/ok`).exec());

	it('post(url)', () => Ask.create().post(`${host}/ok`).exec());

	it('put(url)', () => Ask.create().put(`${host}/ok`).exec());

	it('patch(url)', () => Ask.create().patch(`${host}/ok`).exec());

	it('delete(url)', () => Ask.create().delete(`${host}/ok`).exec());

	it('query(json)', () => {
		const query = { foo: 'bar' };
		return Ask.create().get(`${host}/query`).query(query).exec()
			.then((resp) => assert.deepEqual(resp, query))
		;
	});

	it('body(json)', () => {
		const body = { foo: 'bar' };
		return Ask.create().post(`${host}/json`).body(body)
			// .set('Content-Type', 'application/json')
			.exec().then((resp) => assert.deepEqual(resp, body))
		;
	});

	it('set("Content-Type", "application/x-www-form-urlencoded")', () => {
		const body = { foo: 'bar' };
		return Ask.create().post(`${host}/form`).body(body)
			.set('Content-Type', 'application/x-www-form-urlencoded')
			.exec().then((resp) => assert.deepEqual(resp, body))
		;
	});

	it('set("foo", "bar")', () => Ask
		.create()
		.get(`${host}/headers`)
		.set('foo', 'bar')
		.exec()
		.then((resp) => assert(resp.foo, 'bar'))
	);

	it('headers(json)', () => Ask
		.create()
		.get(`${host}/headers`)
		.headers({ foo: 'bar' })
		.exec()
		.then((resp) => assert(resp.foo, 'bar'))
	);

	it('composable query and url', () => Ask
		.create(host)
		.get('foo')
		.query({ foo: 'a' })
		.url('bar')
		.query({ bar: 'b' })
		.exec()
		.then((resp) => assert.deepEqual(resp, { foo: 'a', bar: 'b' }))
	);

	it('timeout(100)', () => Ask
		.create()
		.get(`${host}/delay`)
		.timeout(100)
		.exec()
		.then(() => assert(false, 'should not go here'))
		.catch((err) => assert(err.status === 408))
	);

	it('cancellation()', () => {
		const cancellation = new Cancellation();
		setTimeout(::cancellation.cancel, 100);
		return Ask
			.create()
			.get(`${host}/delay`)
			.cancellation(cancellation)
			.exec()
			.then(() => assert(false, 'should not go here'))
			.catch((err) => assert(err instanceof Cancellation))
		;
	});

	it('parser()', () => Ask
		.create()
		.get(`${host}/ok`)
		.parser((data) => new Promise((resolve) => {
			setTimeout(() => resolve(data), 100);
		}))
		.parser(() => 'no')
		.parser((data, resp) => new Promise((resolve) => {
			assert.equal(resp.status, 200);
			resolve('yes');
		}))
		.exec()
		.then((resp) => assert.equal(resp, 'yes'))
	);

	it('clone()', () => {
		const origin = Ask.create().url(host).parser((data) => {
			data.parsed = true;
			return data;
		});
		const clone = origin.clone();

		assert(clone instanceof Ask);

		return Promise.all([
			origin.get('ok').exec(),
			clone.post('ok').exec(),
		]).then((([a, b]) => {
			assert(a.parsed);
			assert(b.parsed);
			assert.notEqual(a.method, b.method);
		}));
	});

	it('fork()', () => {
		const origin = Ask.create().url(host);
		return Promise.all([
			origin.get('ok').exec(),
			origin.fork({ method: 'POST' }),
		]).then((([a, b]) => assert(a.method !== b.method)));
	});

	it('Ask.create()', () => assert(Ask.create() instanceof Ask));

	it('Ask.request()', () => Ask.request(`${host}/ok`));
};
