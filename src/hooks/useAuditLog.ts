import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useAuditLog() {
  const { user } = useAuth();

  const log = async (
    action: string,
    targetTable?: string,
    targetId?: string,
    oldData?: any,
    newData?: any
  ) => {
    if (!user) return;
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action,
      target_table: targetTable,
      target_id: targetId,
      old_data: oldData ?? null,
      new_data: newData ?? null,
    });
  };

  return { log };
}
