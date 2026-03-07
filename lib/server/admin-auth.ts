import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdminAuth() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      response: NextResponse.json(
        { message: "No autorizado." },
        { status: 401 },
      ),
      user: null,
    };
  }

  return {
    response: null,
    user,
  };
}
