import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { VIEW_STATE_THREAD_QUERY_PARAM } from "../constants";

export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateQueryParams = React.useCallback(
    (key: string | string[], value?: string | string[]) => {
      if (typeof window === "undefined") return;

      // Determine if we're navigating back from thread view
      const isNavigatingBackFromThread = 
        key === VIEW_STATE_THREAD_QUERY_PARAM && 
        !value && 
        searchParams.has(VIEW_STATE_THREAD_QUERY_PARAM);

      if (Array.isArray(key)) {
        if (!Array.isArray(value) || key.length !== value.length) {
          throw new Error(
            "When key is an array, value must also be an array of the same length"
          );
        }

        const currentUrl = new URL(window.location.href);
        const params = new URLSearchParams(currentUrl.search);

        // Set each key-value pair
        key.forEach((k, index) => {
          if (value[index]) {
            params.set(k, value[index]);
          } else {
            params.delete(k);
          }
        });

        router.replace(
          `${pathname}?${params.toString()}`, 
          { scroll: !isNavigatingBackFromThread }
        );
        return;
      }

      if (Array.isArray(value)) {
        throw new Error("When key is a string, value must also be a string");
      }

      // Get the most current params from the URL
      const currentUrl = new URL(window.location.href);
      const params = new URLSearchParams(currentUrl.search);

      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      // Use replace instead of push to avoid breaking the browser's history
      // Allow scroll restoration when navigating back from thread view
      router.replace(
        `${pathname}?${params.toString()}`, 
        { scroll: !isNavigatingBackFromThread }
      );
    },
    [router, pathname, searchParams]
  );

  const getSearchParam = (name: string): string | undefined => {
    if (typeof window === "undefined") return;
    const currentUrl = new URL(window.location.href);
    const params = new URLSearchParams(currentUrl.search);
    return params.get(name) || undefined;
  };

  return { searchParams, updateQueryParams, getSearchParam };
}
