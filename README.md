A flexible promise based HTTP client for Node.js and browser.

[![Build Status](https://travis-ci.org/Cap32/http-ask.svg?branch=master)](https://travis-ci.org/Cap32/http-ask) [![http-ask code style](https://img.shields.io/badge/code_style-http--ask-brightgreen.svg)](https://github.com/Cap32/http-ask) [![npm version](https://badge.fury.io/js/http-ask.svg)](https://badge.fury.io/js/http-ask)

## Features

- Cloneable and combinable request config
- Support Node.js and browser
- Promise/A+ based
- Chainable API
- Cancelable
- Support timeout

## Installing

Using npm:

```bash
$ npm install http-ask
```

Using yarn:

```bash
$ yarn add http-ask
```

## Usage

Basic `GET` request

```js
// Fetch a user with query (eg: http://localhost/api/users?page=32)
Ask
	.create('http://localhost/api/users')
	.query({ page: 32 })
	.exec()
	.then((data) => console.log(data))
	.catch((error) => console.log(error))
;

// Optionally, you can use an `ask` instance
const ask = new Ask('http://localhost/api/users');
ask
	.query({ page: 32 })
	.exec()
	.then((data) => console.log(data))
	.catch((error) => console.log(error))
;
```

Combinable `url`

```js
// Fetch a user by id. (eg: http://localhost/api/users/2333)
const id = 2333;

Ask
	.create(`http://localhost/api/users/${id}`)
	.exec()
	.then((data) => console.log(data))
	.catch((error) => console.log(error))
;

// Above could also be done as
Ask
	.create('http://localhost')
	.url('api/users')
	.url(id)
	.exec()
	.then((data) => console.log(data))
	.catch((error) => console.log(error))
;
```

Combinable `query`

```js
// Fetch users with token and other query. (eg: http://localhost/api/users?token=asdf&page=23&count=10)
const token = 'asdf';

Ask
	.create('http://localhost/api/users')
	.query({ token, page: 23, count: 10 })
	.exec()
	.then((data) => console.log(data))
	.catch((error) => console.log(error))
;

// Above could also be done as
Ask
	.create('/users')
	.query({ token })
	.query({ page: 23, count: 10 })
	.exec()
	.then((data) => console.log(data))
	.catch((error) => console.log(error))
;

```

Clone `ask` instance

```js
const apiHost = 'http://localhost/api';
const token = 'asdf';

// create a common api `ask` instance
const askApiWithToken = new Ask(apiHost).query({ token });

askApiWithToken
	.clone()
	.url('users')
	.query({ page: 23, count: 10 })
	.exec()
	.then((data) => console.log(data))
	.catch((error) => console.log(error))
;

askApiWithToken
	.clone()
	.url('users')
	.query({ page: 1 })
	.exec()
	.then((data) => console.log(data))
	.catch((error) => console.log(error))
;
```

Performing `POST`, `PUT`, `DELETE` request

```js

// create a common posts `ask` instance
const askPosts = askApiWithToken.clone().url('posts');

// post
askPosts
	.clone()
	.post()
	.body({ name: 'Chirs' })
	.exec()
	.then((data) => console.log(data))
	.catch((error) => console.log(error))
;

// put
askPosts
	.clone()
	.put(id)
	.body({ name: 'Chirs' })
	.exec()
	.then((data) => console.log(data))
	.catch((error) => console.log(error))
;

// delete
askPosts
	.clone()

	.method('delete')
	.url(id)
	// Above two lines are equal with `.delete(id)`

	.exec()
	.then((data) => console.log(data))
	.catch((error) => console.log(error))
;

```

## API

### Class: new Ask([url[, config]])

Create an ask instance.

##### Arguments

1. `url` (String): Request URL. In fact, it could be a part (or prefix) of URL.
2. `config` (Object): Support `query`, `method`, `url`, `headers`, `cancellation`, `timeout`, and any other options from [fetch api options](https://developer.mozilla.org/en-US/docs/Web/API/GlobalFetch/fetch)

##### Return

(Object): `ask` instance.

##### Example
```js
// es6
import Ask from 'http-ask';

// es5
// var Ask = require('http-ask').default;

const ask = new Ask('url', {
	method: 'post',
	body: { ur: 'awesome' }
});
```

---

#### Static Method: Ask.create([url[, config]])

The same with `new Ask()`.

##### Return

(Object): `ask` instance.

---

#### Static Method: Ask.request(url[, config])

Short hand for `Ask.create(url, config).exec()`;

##### Return

(Promise): A promise to get response data.

---

#### Static Method: Ask.clone(ask)

The same with `ask.clone()`.

##### Return

(Object): `ask` instance.

---

#### Static Property: Ask.Cancellation()

See the follow `Cancellation` section for detail.

##### Return

(Object): `cancellation` instance, which has a `cancel` method.

---

#### Method: ask#method(method)

Set HTTP request method

##### Arguments

1. `method` (String): All HTTP methods are supported. Default to `get`.

##### Return

(Object): `ask` instance.

---

#### Method: ask#get([url])

Set `GET` method and url.

##### Arguments

1. [`url`] (String): Request URL.

##### Return

(Object): `ask` instance.

---

#### Method: ask#post([url])

Set `POST` method and url.

##### Arguments

1. [`url`] (String): Request URL.

##### Return

(Object): `ask` instance.

---

#### Method: ask#put([url])

Set `PUT` method and url.

##### Arguments

1. [`url`] (String): Request URL.

##### Return

(Object): `ask` instance.

---

#### Method: ask#patch([url])

Set `PATCH` method and url.

##### Arguments

1. [`url`] (String): Request URL.

##### Return

(Object): `ask` instance.

---

#### Method: ask#delete([url])

Set `DELETE` method and url.

##### Arguments

1. [`url`] (String): Request URL.

##### Return

(Object): `ask` instance.

---

#### Method: ask#url(url)

Set or join URL.

##### Arguments

1. `url` (String): Request URL.

##### Return

(Object): `ask` instance.

##### Example
```js
// `url` doesn't start with `/`
Ask
	.create('http://you.are')
	.url('very/very')
	.url('awesome')
	.exec()
	// the final url is: 'http://you.are/very/very/awesome'
;

// `url` starts with '/'
Ask
	.create('http://you.are')
	.url('very/very')
	.url('/awesome') // start with `/`
	.exec()
	// the final url is: 'http://you.are/awesome'
;
```

---

#### Method: ask#query(query)

Set URL query.

##### Arguments

1. `query` (Object): URL query `JSON`.

##### Return

(Object): `ask` instance.

##### Example
```js
Ask
	.create('http://localhost', {
		query: { a: 1, b: 2 },
	})
	.query({ b: 3, c: 4 })
	.query({ c: 5 })
	.exec()
	// the final url is: 'http://localhost/?a=1&b=3&c=5'
;
```

---

#### Method: ask#body(body)

Set HTTP request body.

##### Arguments

1. `body` (Object): A `JSON` or instance of `FormData` as usual.

##### Return

(Object): `ask` instance.

---

#### Method: ask#set(headerKey, headerValue)

Set HTTP request header.

##### Arguments

1. `headerKey` (String): Header key.
2. `headerValue` (String): Header value.

##### Return

(Object): `ask` instance.

---

#### Method: ask#timeout(ms)

Set HTTP request timeout.

##### Arguments

1. `ms` (Number): Timeout(ms). Defaults to 30000.

##### Return

(Object): `ask` instance.

---

#### Method: ask#cancellation(cancellation)

Set a cancellation token. See the follow example for detail.

##### Arguments

1. `cancellation` (Cancellation).

##### Return

(Object): `ask` instance.

##### Example

```js
import Ask, { Cancellation } from 'http-ask';

const cancellation = new Cancellation();

setTimeout(() => {
	cancellation.cancel(); // trigger cancel
}, 0);

return Ask
	.create('http://localhost/')
	.cancellation(cancellation) // register a cancellation
	.exec()
	.then(() => assert(false, 'should not go here'))
	.catch((err) => assert(err instanceof Cancellation))
;
```

---

#### Method: ask#clone()

Clone `ask` with current config.

##### Return

(Object): `ask` instance.

---

#### Method: ask#exec()

Execute request.

##### Return

(Promise): A promise to get response data.

---


#### Property: ask#response

Http Response instance. It is `null` before `.exec()`.

##### Example

```js
const ask = new Ask('http://localhost/');
ask.exec().then((data) => {
	console.log('response data', data);
	console.log('response status', ask.response.status);
});
```

---

## License

MIT
