"use client"

import { wrapAxios } from '@mountainpass/axios-cache-interceptor'
import axios from 'axios'
import React from 'react'

const axiosInstance = wrapAxios(axios.create({}))

export default function Home() {
  const [data, setData] = React.useState<any>(undefined)
  const [lastFetch, setLastFetched] = React.useState<Date>(new Date(0))
  const [now, setNow] = React.useState<Date>(new Date())
  const [isFetching, setIsFetching] = React.useState<boolean>(false)

  // use effect to keep track of current time
  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetch = async () => {
    setIsFetching(true)
    const result = (await axiosInstance.get('/api'))
    setIsFetching(false)
    const { data, headers } = result
    setData({ data, headers })
    setLastFetched(new Date())
  }
  const fetchNoCache = async () => {
    setIsFetching(true)
    const result = (await axios.get('/api'))
    setIsFetching(false)
    const { data, headers } = result
    setData({ data, headers })
    setLastFetched(new Date())
  }

  return (
    <main>
      <h4>axios-cache-interceptor testing</h4>
      <p>
        <i>304 only returned if within SAME minute AND past stale.</i>
      </p>

      <div className="flex-col">
        
      <div className="flex-row">
        <button onClick={fetchNoCache}>Axios.get (native)</button>
        <button onClick={fetch}>Axios.get (interceptor)</button>
      </div>

      <div><b>isFetching:</b> {isFetching ? 'true' : '-'}</div>
      <div><b>last fetched:</b> {lastFetch.toLocaleString()}</div>
      <div><b>now:</b> {now.toLocaleString()}</div>
      </div>

      <pre>
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  )
}
