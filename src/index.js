
import urlJoin from 'url-join';
import { stringify as serialize } from 'tiny-querystring';

const realFetch = typeof window === 'object' ? fetch : require('node-fetch');

const ContentTypes = {
	FORM: 'application/x-www-form-urlencoded',
	JSON: 'application/json',
};

const { assign } = Object;
const isString = (target) => typeof target === 'string';
const isFunction = (target) => typeof target === 'function';
const isObject = (target) => typeof target === 'object';

const composeURL = (url, queries) => {
	const serializedQuery = queries
		.reduce((list, query) => {
			list.push(isObject(query) ? serialize(query) : query);
			return list;
		}, [])
		.join('&')
	;
	const urlPrefix = urlJoin.apply(null, url);
	const separator = ~urlPrefix.indexOf('?') ? '&' : '?';
	return urlPrefix + separator + serializedQuery;
};

const composeBody = (body, headers) => {
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

const Fetc = function Fetc(...args) {
	if (!(this instanceof Fetc)) {
		return new Fetc(...args);
	}

	this.req = {
		url: [],
		query: [],
		body: {},
		headers: {},
		method: 'GET',
	};
	this._from(...args);
};

assign(Fetc.prototype, {
	_from(...args) {
		args.forEach((arg) => {
			if (isString(arg)) { this.set('url', arg); }
			else if (isObject(arg)) { this.set(arg); }
		});
	},
	set(maybeKey, val) {
		if (maybeKey instanceof Fetc) {
			const instance = maybeKey;
			this.set(instance.req);
		}
		else if (isFunction(maybeKey)) {
			const modify = maybeKey;
			modify(this.req);
		}
		else if (isString(maybeKey)) {
			const key = maybeKey;
			const { req } = this;
			const prev = req[key];
			const arrKeys = ['url', 'query'];
			if (isFunction(val)) {
				val(prev, req, key);
			}
			else if (~arrKeys.indexOf(key)) {
				prev.push.apply(prev, [].concat(val));
			}
			else if (isObject(prev) && isObject(val)) {
				assign(prev, val);
			}
			else {
				req[key] = val;
			}
		}
		else if (isObject(maybeKey)) {
			const obj = maybeKey;
			Object.keys(obj).forEach((key) => this.set(key, obj[key]));
		}
		return this;
	},
	clone() {
		return new Fetc(this);
	},
	composeURL(url, query) {
		return composeURL(url, query);
	},
	composeBody(body, headers) {
		return composeBody(body, headers);
	},
	compose() {
		const { url, query, body, headers, ...other } = this.req;
		return assign(other, {
			headers,
			url: this.composeURL(url, query),
			body: this.composeBody(body, headers),
		});
	},
	fetch(...args) {
		const instance = this.clone();
		instance._from(...args);
		const options = instance.compose();
		const { resolveWith } = options;
		return realFetch(options.url, options).then((response) => {
			return resolveWith ? response[resolveWith]() : response;
		});
	},
	etch(...args) {
		return this.fetch(...args);
	},
});

const f = new Fetc();
Fetc.fetch = f.fetch.bind(f);
Fetc.etch = Fetc.fetch;

export default Fetc;
