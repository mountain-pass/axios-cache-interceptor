import {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

/**
 * An interface for a cache storage implementation.
 */
export interface Storage {
  /** A method to determine a unique key to store the response against. */
  getKey: (request: InternalAxiosRequestConfig) => string;
  /** A method to store a response in the cache. */
  store: (
    response: AxiosResponse,
    freshUntilTimestamp: number,
    staleUntilTimestamp: number
  ) => void;
  /** A method to determine the cache state. */
  status: (request: InternalAxiosRequestConfig) => "fresh" | "stale" | "none";
  /** A method to retrieve a cacched response. */
  get: (
    request: InternalAxiosRequestConfig
  ) => AxiosResponse<any, any> | undefined;
}

/**
 * A simple in-memory cache. No eviction, no persistence.
 */
export class MemoryStorage implements Storage {
  private cache: Map<string, AxiosResponse> = new Map();
  private freshUntilTs: Map<string, number> = new Map();
  private staleUntilTs: Map<string, number> = new Map();
  getKey(request: InternalAxiosRequestConfig<any>): string {
    return `${request.method}#${request.url}`;
  }
  store(
    response: AxiosResponse<any, any>,
    freshUntilTimestamp: number,
    staleUntilTimestamp: number
  ) {
    const now = Date.now();
    const key = this.getKey(response.config);
    this.cache.set(key, response);
    this.freshUntilTs.set(key, freshUntilTimestamp);
    this.staleUntilTs.set(key, staleUntilTimestamp);
  }
  status(request: InternalAxiosRequestConfig<any>): "fresh" | "stale" | "none" {
    const key = this.getKey(request);
    const freshUntil = this.freshUntilTs.get(key);
    const staleUntil = this.staleUntilTs.get(key);
    if (freshUntil && Date.now() < freshUntil) {
      return "fresh";
    } else if (staleUntil && Date.now() < staleUntil) {
      return "stale";
    } else {
      return "none";
    }
  }
  get(
    request: InternalAxiosRequestConfig<any>
  ): AxiosResponse<any, any> | undefined {
    const key = this.getKey(request);
    const val = this.cache.get(key);
    return val;
  }
}

/** Singleton instance - default storage. */
export const MEMORY_STORAGE = new MemoryStorage();

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
 * @param storage - the Storage implementation to use. Defaults to MEMORY_STORAGE.
 * @returns
 */
export const wrapAxios = (
  axiosInstance: AxiosInstance,
  storage: Storage = MEMORY_STORAGE
) => {
  // Add a request interceptor
  axiosInstance.interceptors.request.use(
    function (config) {
      // if no longer actively cached, employ a optimised fetching strategy (i.e. 304 Not modified)
      const cached = storage.get(config);
      if (storage.status(config) === "none") {
        // if etag exists, then use the If-None-Match header...
        if (cached && cached.headers.etag) {
          config.headers["If-None-Match"] = cached.headers.etag;
        }
        // if last-modified (/or date) exists, then use the If-Modified-Since header...
        if (cached && cached.headers["last-modified"]) {
          config.headers["If-Modified-Since"] = cached.headers["last-modified"];
        } else if (cached && cached.headers["date"]) {
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

      storage.store(response, freshUntilTimestamp, staleUntilTimestamp);

      // store cache status in custom response header
      response.headers["x-cache-status"] = storage.status(response.config);

      // NOTE response body is not returned - must be stored/returned by this interceptor!
      if (response.status === 304) {
        console.debug(`returning cached response for 304 Not Modified`);
        return storage.get(response.config) as AxiosResponse;
      }

      return response;
    },
    function (error) {
      // NOTE response body is not returned - must be stored/returned by this interceptor!
      if (error.response.status === 304) {
        console.debug(`returning cached response for 304 Not Modified`);
        return Promise.resolve(storage.get(error.response.config));
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};
