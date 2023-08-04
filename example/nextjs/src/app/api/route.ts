import { NextResponse } from "next/server";

export async function GET(req: Request, res: any) {
    return NextResponse.json({ text: 'Hello' })
}