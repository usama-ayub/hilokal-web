import { NextResponse } from "next/server";
import { VIRTUAL_GIFTS } from "@/lib/gifts";

export async function GET() {
  return NextResponse.json({
    success: true,
    gifts: VIRTUAL_GIFTS,
    notice: "100% Free Virtual Gift Economy. Coins are complimentary daily rewards.",
  });
}
