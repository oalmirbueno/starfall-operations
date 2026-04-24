import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type LinkType = "site" | "ferramenta" | "doc" | "memoria";

export interface UsefulLink {
  id: string;
  user_id: string;
  title: string;
  url: string;
  description: string | null;
  link_type: LinkType;
  category: string | null;
  favorite: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export type UsefulLinkInput = Omit<
  UsefulLink,
  "id" | "user_id" | "created_at" | "updated_at" | "position"
> & { position?: number };

export function useUsefulLinks() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const list = useQuery({
    queryKey: ["useful_links", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("useful_links")
        .select("*")
        .order("favorite", { ascending: false })
        .order("position", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as UsefulLink[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: UsefulLinkInput) => {
      if (!userId) throw new Error("Sem usuário autenticado");
      const { data, error } = await supabase
        .from("useful_links")
        .insert({ ...input, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data as UsefulLink;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["useful_links", userId] });
      toast.success("Link adicionado");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao adicionar link"),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<UsefulLink> & { id: string }) => {
      const { data, error } = await supabase
        .from("useful_links")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as UsefulLink;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["useful_links", userId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao atualizar link"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("useful_links").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["useful_links", userId] });
      toast.success("Link removido");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao remover link"),
  });

  return { list, create, update, remove };
}
