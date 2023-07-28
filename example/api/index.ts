import express, { Request, Response} from 'express'

const app = express()

// enable etag (default on)
// app.set('etag', 'strong')

// enable cors
app.use((req: Request, res: Response, next) => {
    res.setHeader('Access-Control-Allow-Headers', '*')
    res.setHeader('Access-Control-Expose-Headers', '*')
    res.setHeader('Access-Control-Allow-Origin', '*')
    next()
})

// log response status codes
app.use((req, res, next) => {
    res.on('finish', () => {
      console.log(`response : ${req.method} ${req.url} -> ${res.statusCode} (etag = ${res.getHeader('etag')}))`);
    });
    next();
  });

app.get('/test/', (req: Request, res: Response) => {
    console.log(`request : if-none-match header : ${req.header('if-none-match')}`)
    res.setHeader('Cache-Control', 'public, max-age=10, stale-while-revalidate=10')
    res.json({"minuteOfHour": new Date().getMinutes() }) // don't let object change too often
})

app.listen(3000, () => console.log('server started: port 3000'))