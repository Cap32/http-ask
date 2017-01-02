
import 'isomorphic-fetch';
import assign from 'object-assign';
import urlJoin from 'url-join';

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
	const joinedUrl = urlJoin(...url);
	const partials = joinedUrl.split('?');
	const pathname = partials.shift();
	const queryStringAlt = partials.join('?');
	const queryStringArr = [queryString, queryStringAlt];
	const finalQueryString = queryStringArr.filter(Boolean).join('&');
	return [pathname, finalQueryString].filter(Boolean).join('?');
};

const serializeBody = (body, headers) => {
	const contentType = headers['Content-Type'];

	if (body && !isString(body)) {
		if (contentType === ContentTypes.JSON) {
			return JSON.stringify(body);
		}
		else if (contentType === ContentTypes.FORM) {
			return serialize(body);
		}
	}

	return body;
};

const parseResp = (parsers = [], ctx) => (data) => {
	const { length } = parsers;
	let i = 0;
	return new Promise((resolve) => {
		const next = (data) => {
			if (i < length) {
				const parser = parsers[i];
				i++;
				Promise.resolve(parser(data, ctx.response)).then(next);
			}
			else {
				resolve(data);
			}
		};
		next(data);
	});
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
	static create(input, opts) {
		return new Ask(input, opts);
	}

	static clone(ask) {
		return ask.clone();
	}

	static request(input, opts) {
		return new Ask(input, opts).exec();
	}

	static Cancellation = Cancellation;

	constructor(input, opts = {}) {
		this._req = {
			url: [],
			parser: [],
			query: {},
			headers: {},
			method: 'GET',
		};

		this.options(input, opts);
		this.response = null;
	}

	clone(input, opts) {
		const { _req } = this;
		const url = [].concat(_req.url);
		const parser = [].concat(_req.parser);
		const query = assign({}, _req.query);
		const headers = assign({}, _req.headers);
		const req = assign({}, _req, { url, parser, query, headers });
		return new Ask(req).options(input, opts);
	}

	fork(input, opts) {
		return this.clone(input, opts).exec();
	}

	options(input = '', opts = {}) {
		if (!isString(input)) {
			assign(opts, input);
			input = opts.url;
		}

		const { query, headers, url = input, ...other } = opts;

		this._req = assign(this._req || {}, other);

		url && this.url(url);
		query && this.query(query);
		headers && this.headers(headers);

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

	url(url) {
		this._req.url.push(...[].concat(url));
		return this;
	}

	parser(parser) {
		this._req.parser.push(...[].concat(parser));
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

	headers(set = {}) {
		assign(this._req.headers, set);
		return this;
	}

	cancellation(cancellation) {
		this._req.cancellation = cancellation;
		return this;
	}

	timeout(ms = DEFAULT_TIMEOUT) {
		this._req.timeout = +ms;
		return this;
	}

	_timeout() {
		const { timeout = DEFAULT_TIMEOUT } = this._req;
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

	promise = this.exec;

	exec(input, opts) {
		const request = () => {
			const {
				url,
				method = 'GET',
				query,
				body,
				headers = {},
				parser,
				...other,
			} = this._req;

			if (
				body &&
				!headers['Content-Type'] &&
				(typeof FormData !== 'function' || !(body instanceof FormData))
			) {
				headers['Content-Type'] = ContentTypes.JSON;
			}

			const options = assign({
				method: method.toUpperCase(),
				body: serializeBody(body, headers),
				headers,
			}, other);

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
			}).then(parseResp(parser, this));
		};

		this.options(input, opts);

		const promises = [request(), this._timeout()];
		this._req.cancellation && promises.push(this._cancel());
		return Promise.race(promises);
	}
}
