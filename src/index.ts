import {
  AxiosInstance,
  AxiosResponse,
} from "axios";
import { CacheInterface } from "./CacheInterface";
import { InMemoryCache } from "./InMemoryCache";

/**
 * Provides a wrapper around an axios instance to enable caching.
 *
 * Stores response objects for the purpose of:
 * a) determining if a response is fresh or stale
 * b) returning a cached response if the server returns a 304 Not Modified
 *
 * All other caching logic is handled by the browser's nativing caching and/or intermediary caches (i.e. web proxy).
 *
 * Supports response headers: Etag, Last-Modified, Cache-Control (max-age, stale-while-revalidate), Date
 * Supports request headers: If-None-Match, If-Modified-Since
 *
 * @param axiosInstance - the axios instance to wrap
 * @param cache - the CacheInterface implementation to use. Defaults to InMemoryCache.
 * @returns
 */
export const wrapAxios = (
  axiosInstance: AxiosInstance,
  cache: CacheInterface = new InMemoryCache()
) => {
  // Add a request interceptor
  axiosInstance.interceptors.request.use(
    function (config) {
      // if no longer actively cached, employ a optimised fetching strategy (i.e. 304 Not modified)
      const cached = cache.get(config);
      if (cache.status(config) === "none") {
        // if etag exists, then use the If-None-Match header...
        if (cached && cached.headers.etag) {
          config.headers["If-None-Match"] = cached.headers.etag;
        }
        // else if last-modified exists, then use the If-Modified-Since header...
        else if (cached && cached.headers["last-modified"]) {
          config.headers["If-Modified-Since"] = cached.headers["last-modified"];
        }
        // else if date exists, then use the If-Modified-Since header...
        else if (cached && cached.headers["date"]) {
          config.headers["If-Modified-Since"] = cached.headers["date"];
        }
      }
      return config;
    },
    function (error: any) {
      // Do something with request error?
      return Promise.reject(error);
    }
  );

  // Add a response interceptor
  axiosInstance.interceptors.response.use(
    function (response: AxiosResponse): AxiosResponse {
      // get max-age and stale-while-revalidate
      const cacheControlHeader = response.headers["cache-control"];
      const date = response.headers["date"];
      const maxAge = cacheControlHeader.match(/max-age=(\d+)/);
      const staleWhileRevalidate = cacheControlHeader.match(
        /stale-while-revalidate=(\d+)/
      );

      let now = Date.now();
      let maxAgeDuration = 0;
      let staleAgeDuration = 0;
      if (date) {
        now = new Date(date).getTime();
      }
      if (maxAge) {
        maxAgeDuration = parseInt(maxAge[1]) * 1000;
      }
      if (staleWhileRevalidate) {
        staleAgeDuration = parseInt(staleWhileRevalidate[1]) * 1000;
      }
      const freshUntilTimestamp = now + maxAgeDuration;
      const staleUntilTimestamp = now + maxAgeDuration + staleAgeDuration;

      cache.store(response, freshUntilTimestamp, staleUntilTimestamp);

      // store cache status in custom response header
      response.headers["x-cache-status"] = cache.status(response.config);

      // NOTE response body is not returned - must be stored/returned by this interceptor!
      if (response.status === 304) {
        console.debug(`returning cached response for 304 Not Modified`);
        return cache.get(response.config) as AxiosResponse;
      }

      return response;
    },
    function (error) {
      // NOTE response body is not returned - must be stored/returned by this interceptor!
      if (error.response.status === 304) {
        console.debug(`returning cached response for 304 Not Modified`);
        return Promise.resolve(cache.get(error.response.config));
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};
