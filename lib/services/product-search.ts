"use client";

import useSWR from "swr";

import { type Product } from "@/lib/domain/product";
import { fetcher } from "@/lib/services/fetcher";

export function useProductSearch(query: string) {
  const params = new URLSearchParams({ q: query });
  const key = `/api/products/search?${params.toString()}`;

  return useSWR<Product[]>(key, fetcher<Product[]>, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    keepPreviousData: false,
  });
}
