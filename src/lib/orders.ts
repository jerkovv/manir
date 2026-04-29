import { supabase } from "@/integrations/supabase/client";

export type ResendAction =
  | "create"
  | "reuse"
  | "regenerate"
  | "regenerate_partial"
  | "skip_all_used";

export interface ResendStatus {
  tokens_count: number;
  tokens_used_count: number;
  tokens_active_count: number;
  tokens_expired_count: number;
  can_resend: boolean;
  suggested_action: ResendAction;
}

export async function fetchResendStatus(orderId: string): Promise<ResendStatus | null> {
  const { data, error } = await supabase.rpc("get_resend_status_for_order", { _order_id: orderId });
  if (error || !data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return (row as ResendStatus) ?? null;
}

export async function fetchResendStatuses(
  orderIds: string[],
): Promise<Record<string, ResendStatus>> {
  if (orderIds.length === 0) return {};
  const results = await Promise.all(
    orderIds.map(async (id) => {
      const status = await fetchResendStatus(id);
      return [id, status] as const;
    }),
  );
  const out: Record<string, ResendStatus> = {};
  for (const [id, s] of results) {
    if (s) out[id] = s;
  }
  return out;
}

export function resendActionLabel(action: ResendAction): string {
  switch (action) {
    case "create":
      return "Pošalji review email";
    case "reuse":
      return "Pošalji ponovo";
    case "regenerate":
      return "Obnovi i pošalji";
    case "regenerate_partial":
      return "Obnovi preostale i pošalji";
    case "skip_all_used":
      return "Sve recenzije poslate";
  }
}