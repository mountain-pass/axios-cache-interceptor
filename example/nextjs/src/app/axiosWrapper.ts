import { AxiosInstance, AxiosResponse } from "axios";

// determines the cache status of a response HIT MISS or STALE
export const getCacheStatus = (response: AxiosResponse): "HIT" | "MISS" | "STALE" => {
  const cacheControlHeader = response.headers["cache-control"];
  if (cacheControlHeader) {
    let now = Date.now();
    let dateHeader = Date.now();
    let maxAgeDuration = 0;
    let staleAgeDuration = 0;

    const date = response.headers["date"];
    const maxAge = cacheControlHeader.match(/max-age=(\d+)/);
    const staleWhileRevalidate = cacheControlHeader.match(
      /stale-while-revalidate=(\d+)/
    );
    if (date) {
        dateHeader = new Date(date).getTime();
    }
    if (maxAge) {
      maxAgeDuration = parseInt(maxAge[1]) * 1000;
    }
    if (staleWhileRevalidate) {
      staleAgeDuration = parseInt(staleWhileRevalidate[1]) * 1000;
    }
    const freshUntilTimestamp = dateHeader + maxAgeDuration;
    const staleUntilTimestamp = dateHeader + maxAgeDuration + staleAgeDuration;
    const xCacheStatus = now < freshUntilTimestamp
    ? "HIT"
    : now < staleUntilTimestamp
    ? "STALE"
    : "MISS";
    
    console.debug(`x-cache-status: ${xCacheStatus}`, { now, dateHeader, maxAgeDuration, staleAgeDuration, freshUntilTimestamp, staleUntilTimestamp })
      return xCacheStatus
  }
  return "MISS";
};

/**
 * Provides a wrapper around an axios instance to provide an `x-cache-status` response header.
 * 
 * Relies on 304 responses, providing an updatinged `Date` header.
 * 
 * Values:
 * - HIT / STALE / MISS
 *
 * @param axiosInstance - the axios instance to wrap
 * @returns
 */
export const wrapAxios = (axiosInstance: AxiosInstance) => {
  // Add a response interceptor
  axiosInstance.interceptors.response.use(
    function (response: AxiosResponse): AxiosResponse {
      // store cache status in custom response header
      response.headers["x-cache-status"] = getCacheStatus(response);
      return response;
    },
    function (error) {
      error.response.headers["x-cache-status"] = getCacheStatus(error.response);
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};
