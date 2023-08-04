import { NextResponse } from "next/server";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(req: Request, res: any) {
  await sleep(500);
  // res.setHeader("Cache-Control", "private, max-age=10, stale-while-revalidate=10");
  // don't let object change too often - otherwise etag will change
  // res.json({ minuteOfHour: new Date().getMinutes() });
  return NextResponse.json(
    { minuteOfHour: new Date().getMinutes() },
    {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=10, stale-while-revalidate=10",
      },
    }
  );
}
