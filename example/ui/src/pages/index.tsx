import * as React from "react"
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
    const result = (await axiosInstance.get('http://www.localhost:3000/test'))
    const cacheStatus = result.headers['x-cache-status']
    console.debug(`Received response status: ${cacheStatus}`)
    setCached(cacheStatus)
    setData(result.data)
    setLastFetched(new Date(result.headers['date']).getTime())
  }

  return <>
  <h1>Hello!</h1>
  <button onClick={fetch}>Fetch</button>
  <pre style={{ border: '1px solid grey', padding: '10px 15px' }}>
    {JSON.stringify(data, null, 2)}
  </pre>
  <p>cached: {cached}</p>
  <p>last fetched: {lastFetch ? new Date(lastFetch).toLocaleString() : 'never'}</p>
  <p>now: {now ? new Date(now).toLocaleString() : 'never'}</p>
  </>
}