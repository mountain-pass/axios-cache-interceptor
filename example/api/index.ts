import express, { Request, Response } from "express";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const app = express();

// enable etag (default on)
// app.set('etag', true)

// enable cors
app.use((req: Request, res: Response, next) => {
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Expose-Headers", "*");
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// log response status codes
app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(
      `response : ${req.method} ${req.url} -> ${
        res.statusCode
      } (etag = ${res.getHeader("etag")}))`
    );
  });
  next();
});

app.get("/api", async (req: Request, res: Response) => {
  console.log(`request : if-none-match header : ${req.header("if-none-match")}`);
  // simulate work being done
  await sleep(2000);
  res.setHeader("Cache-Control", "public, max-age=10, stale-while-revalidate=10");
  // don't let object change too often - otherwise etag will change
  res.json({ minuteOfHour: new Date().getMinutes() });
});

app.listen(3000, () => console.log("server started: port 3000"));
