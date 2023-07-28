# axios-cache-interceptor

A clean, minimal implementation of common HTTP caching mechanisms for axios (web).

Provides a wrapper around an axios instance to enable out of the box, cache strategies.

Almost all caching logic is handled by the browser's native caching and/or intermediary caches (i.e. web proxy).

# Implementation

Stores response objects for the purpose of:

1. returning a cached response if the server returns a 304 Not Modified
1. determining if a response is fresh or stale when re-requesting

Supports response headers: `Etag`, `Last-Modified`, `Cache-Control (max-age, stale-while-revalidate)`, `Date`

Supports request headers: `If-None-Match`, `If-Modified-Since`

Default Storage (In Memory) can be overridden, by providing a custom implementation that extends the `Storage` interface.

# Install

```sh
npm i @mountainpass/axios-cache-interceptor
```

# Usage

```javascript
import { wrapAxios } from "@mountainpass/axios-cache-interceptor";

// setup
const axiosInstance = wrapAxios(axiosInstance)

// use
const result = await axiosInstance.get('http://www.localhost:3000/test')

// check browser cache status
console.log(result.headers['x-cache-status']) // 'fresh' | 'stale' | 'none'
```

# `x-cache-status` response header

The cache status is a derived value, based on the HTTP headers `Date`, `Cache-Control: max-age`, `Cache-Control: stale-while-revalidate` and the current date timestamp (i.e. `Date.now()`).

It's very useful for determining if a Reponse is `stale`, which may require refetching in the future.

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
