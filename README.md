# axios-cache-interceptor

A clean, minimal implementation of common HTTP caching mechanisms for axios.

Provides a wrapper around an axios instance to enable caching.

Stores response objects for the purpose of:

1. returning a cached response if the server returns a 304 Not Modified
1. determining if a response is fresh or stale when re-requesting

All other caching logic is handled by the browser's nativing caching and/or intermediary caches (i.e. web proxy).

Supports response headers: `Etag`, `Last-Modified`, `Cache-Control (max-age, stale-while-revalidate)`, `Date`

Supports request headers: `If-None-Match`, `If-Modified-Since`

Default Storage (In Memory) can be overridden, by providing a custom implementation that extends the `Storage` interface.

# Usage

```
import { wrapAxios } from "@mountainpass/axios-cache-interceptor";

const axiosInstance = wrapAxios(axiosInstance)
```