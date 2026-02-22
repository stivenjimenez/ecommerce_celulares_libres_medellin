"use client";

import useSWR from "swr";

import { type Product } from "@/lib/domain/product";
import { fetcher } from "@/lib/services/fetcher";

export function useProducts() {
  return useSWR<Product[]>("/api/products", fetcher<Product[]>);
}

export function useProduct(slug: string) {
  const key = slug ? `/api/products/${slug}` : null;
  return useSWR<Product>(key, fetcher<Product>);
}

export function useFeaturedProducts() {
  const { data, error, isLoading } = useProducts();

  return {
    data: data?.filter((product) => product.featured) ?? [],
    error,
    isLoading,
  };
}
