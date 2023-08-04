"use client"

import Image from 'next/image'
import React from 'react'
import axios from 'axios'
import { wrapAxios } from '@mountainpass/axios-cache-interceptor'

const axiosInstance = wrapAxios(axios.create({}))

export default function Home() {
  const [data, setData] = React.useState<any>(undefined)
  const [cached, setCached] = React.useState<boolean>(false)
  const [lastFetch, setLastFetched] = React.useState<number>(0)
  const [now, setNow] = React.useState<number>(0)

  // use effect to keep track of current time
  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetch = async () => {
    const result = (await axiosInstance.get('/api'))
    const { data, headers } = result
    const cacheStatus = result.headers['x-cache-status']
    console.debug(`Received response status: ${cacheStatus}`)
    setCached(cacheStatus)
    setData({ data, headers })
    setLastFetched(new Date(result.headers['date']).getTime())
  }
  const fetchNoCache = async () => {
    const result = (await axios.get('/api'))
    const { data, headers } = result
    const cacheStatus = result.headers['x-cache-status']
    console.debug(`Received response status: ${cacheStatus}`)
    setCached(cacheStatus)
    setData({ data, headers })
    setLastFetched(new Date(result.headers['date']).getTime())
  }

  return (
    <main>
      <h4>axios-cache-interceptor testing</h4>
      <div className="flex-row">
        <button onClick={fetch}>Fetch with Interceptor</button>
        <button onClick={fetchNoCache}>Fetch without Interceptor</button>
      </div>
      <pre>
        {JSON.stringify(data, null, 2)}
      </pre>
      <p><b>cached:</b> {cached}</p>
      <p><b>last fetched:</b> {lastFetch ? new Date(lastFetch).toLocaleString() : 'never'}</p>
      <p><b>now:</b> {now ? new Date(now).toLocaleString() : 'never'}</p>
    </main>
  )
}
