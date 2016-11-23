
import 'isomorphic-fetch';
import assign from 'object-assign';

const DEFAULT_TIMEOUT = 30000;

const ContentTypes = {
	FORM: 'application/x-www-form-urlencoded',
	JSON: 'application/json',
};

const isString = (target) => typeof target === 'string';

const serialize = (json) => Object
	.keys(json)
	.map((key) => `${key}=${encodeURIComponent(json[key])}`)
	.join('&')
;

const withQuery = (url, query) => {
	const queryString = serialize(query);
	const partials = url.split('?');
	const pathname = partials[0];
	const queryStringAlt = partials[1];
	const queryStringArr = [queryString, queryStringAlt];
	const finalQueryString = queryStringArr.filter(Boolean).join('&');
	return [pathname, finalQueryString].filter(Boolean).join('?');
};

export class Cancellation {
	constructor(message) {
		this.statusText = this.message = message || 'Request Canceled';
		this.status = 'canceled';
		this.ok = false;
		this._handleCancel = () => {};
	}

	__listen() {
		return new Promise((resolve, reject) => {
			this._handleCancel = reject;
		});
	}

	cancel() {
		this._handleCancel(this);
	}
}

export default class Ask {
	static create(...args) {
		return new Ask(...args);
	}

	static clone(ask) {
		return new Ask(ask);
	}

	static request(...args) {
		return new Ask(...args).exec();
	}

	static Cancellation = Cancellation;

	constructor(input = '', init = {}) {
		const req = input instanceof Ask ? input._req : {};
		const url = req.url || input || init.url;
		const method = req.method || init.method || 'GET';
		const query = req.query || init.query || {};
		const headers = req.headers || init.headers || {};
		const cancellation = req.cancellation || init.cancellation;
		const other = req.other || input || {};

		this._req = {
			method,
			query,
			headers,
			url,
			cancellation,
			other,
		};
		this.response = null;
	}

	clone() {
		return new Ask(this);
	}

	options(other = {}) {
		assign(this._req.other, other);
		return this;
	}

	method(method = 'GET') {
		this._req.method = method;
		return this;
	}

	get(url) {
		return this.method('GET').url(url);
	}

	post(url) {
		return this.method('POST').url(url);
	}

	put(url) {
		return this.method('PUT').url(url);
	}

	patch(url) {
		return this.method('PATCH').url(url);
	}

	delete(url) {
		return this.method('DELETE').url(url);
	}

	url(path = '') {
		const { url } = this._req;
		this._req.url = /^(\/|https?\:\/\/)/.test(path) ?
			path : [url, path].filter(Boolean).join('/')
		;
		return this;
	}

	query(query = {}) {
		assign(this._req.query, query);
		return this;
	}

	body(body) {
		this._req.body = body;
		return this;
	}

	set(key, value) {
		this._req['headers'][key] = value;
		return this;
	}

	cancellation(cancellation) {
		this._req.cancellation = cancellation;
		return this;
	}

	timeout(ms = DEFAULT_TIMEOUT) {
		this._req.other.timeout = +ms;
		return this;
	}

	_timeout() {
		const { timeout = DEFAULT_TIMEOUT } = this._req.other;
		return new Promise((resolve, reject) => setTimeout(() => {
			const resp = this.response = new Response(null, {
				statusText: 'Request Timeout',
				status: 408,
			});
			reject(resp);
		}, timeout));
	}

	_cancel() {
		const { cancellation } = this._req;
		return cancellation && cancellation
			.__listen()
			.catch((cancellation) => {
				this.response = cancellation;
				throw cancellation;
			})
		;
	}

	_request() {
		const { _req } = this;
		const {
			query, headers, method = 'GET', other, url = '',
		} = _req;
		let { body } = _req;

		if (!headers['Content-Type']) {
			headers['Content-Type'] = ContentTypes.JSON;
		}

		const contentType = headers['Content-Type'];

		if (body && !isString(body)) {
			if (contentType === ContentTypes.JSON) {
				body = JSON.stringify(body);
			}
			else if (contentType === ContentTypes.FORM) {
				body = serialize(body);
			}
		}

		const options = assign({}, other, {
			method: method.toUpperCase(),
			headers,
			body,
		});

		const finalURL = withQuery(url, query);

		return fetch(finalURL, options).then((resp) => {
			if (this.response) { return this.response; }

			if (!resp.ok) {
				const error = new Error(resp.statusText);
				resp.status && (error.code = resp.status);
				throw error;
			}

			this.response = resp;
			const contentType = resp.headers.get('content-type');
			if (contentType && contentType.indexOf('application/json') !== -1) {
				return resp.json();
			}
			else {
				return resp.text();
			}
		});
	}

	promise = this.exec;

	exec() {
		const promises = [
			this._request(),
			this._timeout(),
		];
		this._req.cancellation && promises.push(this._cancel());
		return Promise.race(promises);
	}
}
