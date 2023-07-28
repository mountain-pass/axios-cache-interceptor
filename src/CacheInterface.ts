import {
    AxiosResponse,
    InternalAxiosRequestConfig
} from "axios";

/**
 * An interface for a cache implementation.
 */
export interface CacheInterface {
    
    /** Determine if a request should be cached. */
    shouldCache: (request: InternalAxiosRequestConfig) => boolean;

    /** Determines a unique key to store the response against. */
    getKey: (request: InternalAxiosRequestConfig) => string;
    
    /** Stores a response in the cache. */
    store: (
        response: AxiosResponse,
        freshUntilTimestamp: number,
        staleUntilTimestamp: number
    ) => void;
    
    /** Determines the cache state of a request. */
    status: (request: InternalAxiosRequestConfig) => "fresh" | "stale" | "none";
    
    /** Retrieves a cached response. */
    get: (
        request: InternalAxiosRequestConfig
    ) => AxiosResponse<any, any> | undefined;
}
