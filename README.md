# axios-cache-interceptor

A clean, minimal implementation of common HTTP caching mechanisms for axios (web).

Provides a wrapper around an axios instance to enable out of the box, cache strategies.

Almost all caching logic is handled by the browser's native caching and/or intermediary caches (i.e. web proxy).

Additionally, provides an indication of whether your response is `fresh`, `stale` or `none` (not cached. @see [`x-cache-status` response header](#x-cache-status-response-header) below).

# stale responses

Knowing a Reponse is `stale` is extremely useful. If you receive a `stale` status, the browser will asychronously fetch a fresh request in the background, meaing the next response will instantly respond with fresh data.

You will only ever receive the same `stale` response once. Subsequent requests will wait for the background request to complete<sup>1</sup>.

The `stale-while-revalidate` is not only a useful tool for providing a seamless user experience, but is also very useful for updating proxy caches. The client's asynchronous background refresh, will trigger off a refresh in shared proxy caches, meaning caches are refreshed with fresh data in the background, providing benefit to all subsequent users of the endpoint. (Ideally these proxy caches also implement `stale-while-revalidate` logic!)

<sup>1</sup> *Tested in Chrome*

# Implementation

The wrapper stores all successful `AxiosResponse` objects for the purpose of:

1. returning a cached response, if the server returns a 304 Not Modified
2. determining if a response is `fresh` or `stale` when re-requesting an endpoint

Supports response headers:
- [`Etag`](https://datatracker.ietf.org/doc/html/rfc7232#section-2.3)
- [`Last-Modified`](https://datatracker.ietf.org/doc/html/rfc7232#section-2.2)
- [`Cache-Control max-age`](https://datatracker.ietf.org/doc/html/rfc7234#section-5.2.2.8)
- [`Cache-Control stale-while-revalidate`](https://datatracker.ietf.org/doc/html/rfc5861#section-3)
- [`Date`](https://datatracker.ietf.org/doc/html/rfc2616#section-14.18)

Supports response status:
- [`304 Not Modified`](https://datatracker.ietf.org/doc/html/rfc7232#section-4.1)

Automatically adds request headers (if relevant):
- [`If-None-Match`](https://datatracker.ietf.org/doc/html/rfc7232#section-3.2)
- [`If-Modified-Since`](https://datatracker.ietf.org/doc/html/rfc7232#section-3.3)

## Cache

The default cache is an [InMemoryCache](src/InMemoryCache.ts) - it provides a bare minimum implementation.

- It uses an inmemory map to store all successful `GET` responses. 
- There is no cache eviction.
- There is no persistence (data is transient).
- It uses "`${request.method}#${request.url}`" as a key, for storing cached data (Note: no query params or headers).

These options can all be overridden, by providing a custom implementation of the [`CacheInterface`](src/CacheInterface.ts) interface.

```javascript
const axiosInstance = wrapAxios(axiosInstance, myCustomCache)
```

# Install

```sh
npm i @mountainpass/axios-cache-interceptor
```

# Usage (Web Client)

```javascript
import { wrapAxios } from "@mountainpass/axios-cache-interceptor";

// setup
const axiosInstance = wrapAxios(axiosInstance)

// use
const result = await axiosInstance.get('http://www.localhost:3000/test')

// check browser cache status
console.log(result.headers['x-cache-status']) // 'fresh' | 'stale' | 'none'
```

# Server Side Example

Here is an example response, which utilises both `Etag` and `stale-while-revalidate` cache controls.

```javascript
const app = express();

app.set('etag', true) // (redundant, default is on)

app.get("/test/", (req: Request, res: Response) => {
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=3600")
  res.json({ your: 'response' })
});
```

For an example of the api / ui integration, please check the [example](example) folder.

# `x-cache-status` response header

The cache status is a derived value, based on the HTTP headers `Date`, `Cache-Control: max-age`, `Cache-Control: stale-while-revalidate` and the current date timestamp (i.e. `Date.now()`).

- `fresh` - If `Date.now()` is between `Date` and `Date + max-age`.
- `stale` - If `Date.now()` is between `Date + max-age` and `Date + max-age + stale-while-revalidate`.
- `none` - If `Date.now()` is greater than `Date + max-age + stale-while-revalidate`.

# Request strategy

We rely heavily on the browser's inbuilt caching mechanisms. Here is the request interceptor logic:

1. if local cache is `fresh`, return result from browser cache (should be instant)
2. if local cache is `stale`, return result from browser cache (should be instant, and browser handles the asynchronous refetch in the background).
3. otherwise, add the following Request headers:
   1. if `etag` exists, send `If-None-Match`
   2. else, if `last-modified` exists, send `If-Modified-Since`
   3. else, if `date` exists, send `If-Modified-Since`


# Alternatives

I was inspired by https://github.com/arthurfiorette/axios-cache-interceptor , however:

- It is very complex
- It is very large (1.2.0 = 463kB)
- It does not support `stale-while-revalidate` - https://github.com/arthurfiorette/axios-cache-interceptor/issues/512
