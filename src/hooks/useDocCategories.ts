import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface DocCategory {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  kind: string;
  color: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

const KIND = "doc";
const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
   .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "cat";

export function useDocCategories() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const list = useQuery({
    queryKey: ["doc-categories", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories").select("*")
        .eq("kind", KIND).order("position").order("name");
      if (error) throw error;
      return (data ?? []) as DocCategory[];
    },
  });

  const inv = () => {
    qc.invalidateQueries({ queryKey: ["doc-categories", userId] });
    qc.invalidateQueries({ queryKey: ["documents", userId] });
  };

  const create = useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string | null }) => {
      if (!userId) throw new Error("auth");
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Nome obrigatório");
      const max = (list.data ?? []).reduce((m, c) => Math.max(m, c.position), -1);
      const { data, error } = await supabase.from("categories").insert({
        user_id: userId, name: trimmed, slug: slugify(trimmed),
        kind: KIND, color: color ?? null, position: max + 1,
      }).select().single();
      if (error) throw error;
      return data as DocCategory;
    },
    onSuccess: () => { inv(); toast.success("Pasta criada"); },
    onError: (e: any) => toast.error(e.message),
  });

  const rename = useMutation({
    mutationFn: async ({ id, oldName, newName }: { id: string; oldName: string; newName: string }) => {
      const trimmed = newName.trim();
      if (!trimmed) throw new Error("Nome obrigatório");
      const { error } = await supabase.from("categories")
        .update({ name: trimmed, slug: slugify(trimmed) }).eq("id", id);
      if (error) throw error;
      // propaga para documentos que usam o nome antigo
      if (oldName && oldName !== trimmed) {
        await supabase.from("documents").update({ category: trimmed })
          .eq("user_id", userId!).eq("category", oldName);
      }
    },
    onSuccess: () => { inv(); toast.success("Pasta renomeada"); },
    onError: (e: any) => toast.error(e.message),
  });

  const setColor = useMutation({
    mutationFn: async ({ id, color }: { id: string; color: string | null }) => {
      const { error } = await supabase.from("categories").update({ color }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => inv(),
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      // limpa categoria dos docs (vira "Sem categoria")
      await supabase.from("documents").update({ category: null })
        .eq("user_id", userId!).eq("category", name);
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { inv(); toast.success("Pasta removida"); },
    onError: (e: any) => toast.error(e.message),
  });

  const reorder = useMutation({
    mutationFn: async (ordered: DocCategory[]) => {
      // atualiza posições em série (poucas linhas)
      for (let i = 0; i < ordered.length; i++) {
        if (ordered[i].position !== i) {
          await supabase.from("categories").update({ position: i }).eq("id", ordered[i].id);
        }
      }
    },
    onSuccess: () => inv(),
    onError: (e: any) => toast.error(e.message),
  });

  return { list, create, rename, setColor, remove, reorder };
}
