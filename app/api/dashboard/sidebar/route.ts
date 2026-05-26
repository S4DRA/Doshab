import { NextResponse } from "next/server";

import { getDashboardSidebarGroups } from "@/lib/dashboard-data";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ groups: [] }, { status: 401 });
  }

  const groups = await getDashboardSidebarGroups(session.userId);

  return NextResponse.json({ groups });
}
