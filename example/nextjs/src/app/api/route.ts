import { NextResponse } from "next/server";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(req: Request, res: any) {
  // don't let object change too often - otherwise etag will change with it
  let minuteOfHourEtag = `"${new Date().getMinutes()}"`;
  console.log(`found header`, req.headers.get("if-none-match"))
  if (req.headers.get("if-none-match") === minuteOfHourEtag) {
    console.log('sending 304...')
    return new NextResponse(null, { status: 304 });
  } else {
    await sleep(2000);
    minuteOfHourEtag = `"${new Date().getMinutes()}"`;
    console.log('sending FULL...')
    return NextResponse.json(
      { minuteOfHour: minuteOfHourEtag },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=10, stale-while-revalidate=10",
          Etag: minuteOfHourEtag,
        },
      }
    );
  }
}
