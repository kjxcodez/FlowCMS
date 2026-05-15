import useSWR from "swr";
import { Webhook } from "@prisma/client";
import { apiRequest } from "@/lib/api-client";

export function useWebhooks() {
  const { data, error, mutate } = useSWR<Webhook[]>(
    "/api/internal/webhooks",
    apiRequest
  );

  const createWebhook = async (payload: { url: string; events: string[] }) => {
    const response = await fetch("/api/internal/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (result.success) mutate();
    return result;
  };

  const deleteWebhook = async (id: string) => {
    const response = await fetch(`/api/internal/webhooks?id=${id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    if (result.success) mutate();
    return result;
  };

  return {
    webhooks: data,
    isLoading: !error && !data,
    isError: error,
    createWebhook,
    deleteWebhook,
    mutate
  };
}
