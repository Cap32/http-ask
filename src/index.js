
import { stringify as serialize } from 'tiny-querystring';

const { assign } = Object;
const isString = (target) => typeof target === 'string';
const isFunction = (target) => typeof target === 'function';
const isObject = (target) => typeof target === 'object';

const { fetch } = (function () {

	// will be compiled to `false` on Node.js
	if (typeof window === 'object') {

		return self || window;
	}
	else {
		const nodeFetch = require('node-fetch');
		return assign({ fetch: nodeFetch.default }, nodeFetch);
	}
}());

const ContentTypes = {
	form: 'application/x-www-form-urlencoded',
	json: 'application/json',
};

const ErrorNames = {
	timeout: 'TimeoutError',
};

const resolveUrls = function resolveUrls(urls) {
	const paths = [];
	const separateBySlash = function separateBySlash(str) {
		const list = str.split('/').filter((path) => path && path !== '.');
		paths.push.apply(paths, list);
	};
	urls = urls.filter(Boolean);
	if (!urls.length) { throw new Error('Missing url'); }
	urls.forEach((url) => {
		const protocolIndex = url.indexOf('://');
		if (protocolIndex > -1) {
			paths.length = 0;
			paths.push(url.substr(0, protocolIndex) + ':/');
			separateBySlash(url.substr(protocolIndex + 3));
		}
		else {
			separateBySlash(url);
		}
	});
	const resolvedUrl = paths
		.reduce((list, path) => {
			if (path === '..' && list.length) { list.pop(); }
			else if (path !== '.') { list.push(path); }
			return list;
		}, [])
		.join('/')
	;
	const isLastSlash = urls[urls.length - 1].substr(-1) === '/';
	return isLastSlash ? (resolvedUrl + '/') : resolvedUrl;
};

const composeURL = function composeURL(url, queries) {
	const queryStr = queries
		.reduce((list, query) => {
			list.push(isObject(query) ? serialize(query) : query);
			return list;
		}, [])
		.join('&')
	;
	const urlPrefix = resolveUrls(url);
	const sep = ~urlPrefix.indexOf('?') ? '&' : '?';
	return queryStr ? (urlPrefix + sep + queryStr) : urlPrefix;
};

const composeBody = function composeBody(body, headers) {
	const contentType = headers['Content-Type'];
	if (body && !isString(body)) {
		if (contentType === ContentTypes.json) {
			return JSON.stringify(body);
		}
		else if (contentType === ContentTypes.form) {
			return serialize(body);
		}
	}
	return body;
};

const composeHeaders = function composeHeaders(headers, type) {
	if (type) { headers['Content-Type'] = ContentTypes[type] || type; }
	return headers;
};

const flow = function flow(val, fns) {
	const fn = fns.shift();
	return Promise.resolve(
		isFunction(fn) ? flow(fn(val), fns) : val
	);
};

const TransformerHooks = [
	'Url', 'Body', 'Headers', 'Error', 'Resolve',
];

const RequestExtra = function RequestExtra(...args) {
	if (!(this instanceof RequestExtra)) {
		return new RequestExtra(...args);
	}

	this.req = {
		url: [],
		query: [],
		body: {},
		headers: {},
		method: 'GET',
	};
	this.transformers = {};
	TransformerHooks.forEach((hook) => (this.transformers[hook] = []));
	this._from(...args);
};

assign(RequestExtra.prototype, {
	_from(...args) {
		args.forEach((arg) => {
			if (isString(arg)) { this.set('url', arg); }
			else if (isObject(arg)) { this.set(arg); }
		});
	},
	_cloneTransformers(transformers) {
		TransformerHooks.forEach((hook) => {
			this.transformers[hook].push(...transformers[hook]);
		});
	},
	set(maybeKey, val) {
		if (maybeKey instanceof RequestExtra) {
			const instance = maybeKey;
			this.set(instance.req);
			this._cloneTransformers(instance.transformers);
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
				req[key] = val(prev, req, key);
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
		return new RequestExtra(this);
	},
	compose(...args) {
		try {
			const instance = this.clone();
			instance._from(...args);
			const { type, url, query, body, headers, ...options } = instance.req;
			const composedHeaders = composeHeaders(headers, type);
			const composedURL = composeURL(url, query);
			const composedBody = composeBody(body, composedHeaders);
			return Promise
				.all([
					this._applyUrlTransformer(composedURL),
					this._applyHeadersTransformer(composedHeaders),
					this._applyBodyTransformer(composedBody),
				])
				.then((res) => ({
					url: res[0],
					headers: res[1],
					body: res[2],
					...options,
				}))
			;
		}
		catch (err) {
			return Promise.reject(err);
		}
	},
	fetch(...args) {
		return this
			.compose(...args)
			.then((options) => {
				const { resolveWith, timeout } = options;
				const fetchPromise = fetch(options.url, options).then((response) => {
					return this._applyResolveTransformer(
						resolveWith ? response[resolveWith]() : response,
					);
				});
				const promises = [fetchPromise];
				if (timeout) {
					promises.push(new Promise((resolve, reject) => {
						setTimeout(() => {
							const timeoutError = new Error('Timeout');
							timeoutError.name = ErrorNames.timeout;
							reject(timeoutError);
						}, timeout);
					}));
				}
				return Promise.race(promises);
			})
			.catch((err) => {
				const throwError = function throwError(err) { throw err; };
				const errorPromise = this
					._applyErrorTransformer(err)
					.then(throwError, throwError)
				;
				return errorPromise;
			})
		;
	},
});

TransformerHooks.forEach((hook) => {
	RequestExtra.prototype[`add${hook}Transformer`] = function (fn) {
		this.transformers[hook].push(fn);
		return this;
	};
	RequestExtra.prototype[`remove${hook}Transformer`] = function (fn) {
		const transformers = this.transformers[hook];
		const index = transformers.indexOf(fn);
		index > -1 && transformers.splice(index, 1);
		return this;
	};
	RequestExtra.prototype[`_apply${hook}Transformer`] = function (val) {
		return flow(val, this.transformers[hook]);
	};
});

const requestExtra = new RequestExtra();
const fetchExtra = requestExtra.fetch.bind(requestExtra);
RequestExtra.fetch = fetchExtra;

export default fetchExtra;
export const request = RequestExtra;
export { fetchExtra, RequestExtra };
