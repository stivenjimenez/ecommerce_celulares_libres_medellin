"use client";

import { useEffect, useRef } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthLinkHandler() {
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const currentUrl = new URL(window.location.href);
    const fragment = new URLSearchParams(currentUrl.hash.slice(1));
    const authCode = currentUrl.searchParams.get("code");
    const accessToken = fragment.get("access_token");
    const refreshToken = fragment.get("refresh_token");
    const authError =
      currentUrl.searchParams.get("error") ??
      currentUrl.searchParams.get("error_code") ??
      currentUrl.searchParams.get("error_description") ??
      fragment.get("error") ??
      fragment.get("error_code") ??
      fragment.get("error_description");

    const hasAuthResult = Boolean(
      authCode || accessToken || refreshToken || authError,
    );
    if (!hasAuthResult) return;

    handled.current = true;

    const finish = (destination: string) => {
      window.history.replaceState(
        window.history.state,
        "",
        currentUrl.pathname,
      );
      window.location.replace(destination);
    };

    if (authError) {
      finish("/admin?auth_error=link");
      return;
    }

    let isPasswordRecovery =
      currentUrl.searchParams.get("flow") === "recovery" ||
      currentUrl.searchParams.get("type") === "recovery" ||
      fragment.get("type") === "recovery";

    const supabase = getSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") isPasswordRecovery = true;
    });

    async function consumeAuthResult() {
      try {
        if (authCode) {
          const { data, error } = await supabase.auth.getUser();
          if (error || !data.user) throw error ?? new Error("No user session.");
        } else {
          if (!accessToken || !refreshToken) {
            throw new Error(
              "The auth link did not contain a complete session.",
            );
          }

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error || !data.user) throw error ?? new Error("No user session.");
        }

        finish(
          isPasswordRecovery ? "/admin?flow=recovery" : "/admin?flow=magic",
        );
      } catch {
        finish("/admin?auth_error=link");
      } finally {
        subscription.unsubscribe();
      }
    }

    void consumeAuthResult();
  }, []);

  return null;
}
