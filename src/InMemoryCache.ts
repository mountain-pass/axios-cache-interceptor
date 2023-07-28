import {
    AxiosResponse,
    InternalAxiosRequestConfig
} from "axios";
import { CacheInterface } from "./CacheInterface";

/**
 * A simple in-memory cache. No eviction, no persistence.
 */
export class InMemoryCache implements CacheInterface {
    private cache: Map<string, AxiosResponse> = new Map();
    private freshUntilTs: Map<string, number> = new Map();
    private staleUntilTs: Map<string, number> = new Map();

    shouldCache(request: InternalAxiosRequestConfig<any>): boolean {
        return request.method === "GET";
    }

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
