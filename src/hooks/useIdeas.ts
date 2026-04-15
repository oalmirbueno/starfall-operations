import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const db = supabase as any;

export interface IdeaRow {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  status: string;
  priority: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface IdeaInput {
  title: string;
  content: string;
  status: string;
  priority: string;
  tags: string[];
}

export function useIdeas() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["ideas", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db.from("ideas").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as IdeaRow[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: IdeaInput) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await db.from("ideas").insert({
        user_id: user.id,
        title: input.title,
        content: input.content || null,
        status: input.status,
        priority: input.priority,
        tags: input.tags,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ideas"] }); toast.success("Ideia criada"); },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: IdeaInput & { id: string }) => {
      const { error } = await db.from("ideas").update({
        title: input.title,
        content: input.content || null,
        status: input.status,
        priority: input.priority,
        tags: input.tags,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ideas"] }); toast.success("Ideia atualizada"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("ideas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ideas"] }); toast.success("Ideia removida"); },
    onError: (e: any) => toast.error(e.message),
  });

  return { ideas: query.data ?? [], isLoading: query.isLoading, create, update, remove };
}
