import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useAuditLog } from "./useAuditLog";
import { toast } from "sonner";

export interface Credential {
  id: string;
  user_id: string;
  provider: string;
  login: string;
  password_encrypted: string;
  account: string | null;
  owner: string | null;
  has_2fa: boolean;
  recovery_info: string | null;
  notes: string | null;
  classification: string;
  security_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CredentialInsert = Omit<Credential, "id" | "created_at" | "updated_at">;

export function useCredentials() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { log } = useAuditLog();

  const query = useQuery({
    queryKey: ["credentials", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credentials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Credential[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (input: Omit<CredentialInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("credentials")
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      await log("credential_created", "credentials", data.id, null, { provider: input.provider, login: input.login });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      toast.success("Credencial criada com sucesso");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Credential> & { id: string }) => {
      const { data, error } = await supabase
        .from("credentials")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await log("credential_updated", "credentials", id, null, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      toast.success("Credencial atualizada");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("credentials").delete().eq("id", id);
      if (error) throw error;
      await log("credential_deleted", "credentials", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      toast.success("Credencial removida");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const logReveal = async (id: string, provider: string) => {
    await log("credential_password_revealed", "credentials", id, null, { provider });
  };

  const logCopy = async (id: string, field: string) => {
    await log("credential_field_copied", "credentials", id, null, { field });
  };

  return { credentials: query.data ?? [], isLoading: query.isLoading, error: query.error, create, update, remove, logReveal, logCopy };
}
