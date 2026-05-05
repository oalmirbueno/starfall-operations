import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type DocType = "text" | "link" | "file";

export interface Company {
  id: string; user_id: string;
  name: string; description: string | null;
  website: string | null; logo_url: string | null;
  color: string | null; position: number;
  created_at: string; updated_at: string;
}

export interface DocProject {
  id: string; user_id: string; company_id: string;
  parent_id: string | null;
  name: string; description: string | null;
  status: string; color: string | null; position: number;
  created_at: string; updated_at: string;
}

export interface DocItem {
  id: string; user_id: string;
  company_id: string | null; project_id: string | null;
  title: string; doc_type: DocType; category: string | null;
  content: string | null; url: string | null;
  file_path: string | null; file_name: string | null;
  file_mime: string | null; file_size: number | null;
  tags: string[]; favorite: boolean; position: number;
  created_at: string; updated_at: string;
}

export interface DocVersion {
  id: string; document_id: string; user_id: string;
  version_number: number;
  title: string; doc_type: DocType; category: string | null;
  content: string | null; url: string | null;
  file_path: string | null; file_name: string | null;
  file_mime: string | null; file_size: number | null;
  tags: string[]; company_id: string | null; project_id: string | null;
  change_note: string | null; author_name: string | null;
  created_at: string;
}

export function useDocs() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const companies = useQuery({
    queryKey: ["doc-companies", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*")
        .order("position").order("name");
      if (error) throw error;
      return (data ?? []) as Company[];
    },
  });

  const projects = useQuery({
    queryKey: ["doc-projects", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("doc_projects").select("*")
        .order("position").order("name");
      if (error) throw error;
      return (data ?? []) as DocProject[];
    },
  });

  const documents = useQuery({
    queryKey: ["documents", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("documents").select("*")
        .order("favorite", { ascending: false })
        .order("position").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DocItem[];
    },
  });

  const inv = () => {
    qc.invalidateQueries({ queryKey: ["doc-companies", userId] });
    qc.invalidateQueries({ queryKey: ["doc-projects", userId] });
    qc.invalidateQueries({ queryKey: ["documents", userId] });
  };

  // Companies
  const createCompany = useMutation({
    mutationFn: async (input: Partial<Company>) => {
      if (!userId) throw new Error("auth");
      const { data, error } = await supabase.from("companies")
        .insert({ name: input.name!, description: input.description ?? null, website: input.website ?? null, logo_url: input.logo_url ?? null, color: input.color ?? null, user_id: userId })
        .select().single();
      if (error) throw error; return data as Company;
    },
    onSuccess: () => { inv(); toast.success("Empresa criada"); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateCompany = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Company> & { id: string }) => {
      const { data, error } = await supabase.from("companies").update(patch).eq("id", id).select().single();
      if (error) throw error; return data as Company;
    },
    onSuccess: () => inv(),
    onError: (e: any) => toast.error(e.message),
  });
  const removeCompany = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("companies").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { inv(); toast.success("Empresa removida"); },
    onError: (e: any) => toast.error(e.message),
  });

  // Projects
  const createProject = useMutation({
    mutationFn: async (input: Partial<DocProject> & { company_id: string; name: string }) => {
      if (!userId) throw new Error("auth");
      const { data, error } = await supabase.from("doc_projects")
        .insert({ name: input.name, description: input.description ?? null, status: input.status ?? "ativo", color: input.color ?? null, company_id: input.company_id, parent_id: input.parent_id ?? null, user_id: userId })
        .select().single();
      if (error) throw error; return data as DocProject;
    },
    onSuccess: () => { inv(); toast.success("Projeto criado"); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateProject = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<DocProject> & { id: string }) => {
      const { data, error } = await supabase.from("doc_projects").update(patch).eq("id", id).select().single();
      if (error) throw error; return data as DocProject;
    },
    onSuccess: () => inv(),
    onError: (e: any) => toast.error(e.message),
  });
  const removeProject = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("doc_projects").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { inv(); toast.success("Projeto removido"); },
    onError: (e: any) => toast.error(e.message),
  });

  // Documents
  const createDocument = useMutation({
    mutationFn: async (input: Partial<DocItem>) => {
      if (!userId) throw new Error("auth");
      const payload = {
        user_id: userId,
        title: input.title!,
        doc_type: (input.doc_type ?? "text") as DocType,
        company_id: input.company_id ?? null,
        project_id: input.project_id ?? null,
        category: input.category ?? null,
        content: input.content ?? null,
        url: input.url ?? null,
        file_path: input.file_path ?? null,
        file_name: input.file_name ?? null,
        file_mime: input.file_mime ?? null,
        file_size: input.file_size ?? null,
        tags: input.tags ?? [],
        favorite: input.favorite ?? false,
      };
      const { data, error } = await supabase.from("documents").insert(payload).select().single();
      if (error) throw error; return data as DocItem;
    },
    onSuccess: () => { inv(); toast.success("Documento salvo"); },
    onError: (e: any) => toast.error(e.message),
  });
  const snapshotVersion = async (doc: DocItem, changeNote?: string) => {
    if (!userId) return;
    // pega próximo número
    const { data: last } = await supabase
      .from("document_versions").select("version_number")
      .eq("document_id", doc.id).order("version_number", { ascending: false }).limit(1).maybeSingle();
    const nextNum = ((last as any)?.version_number ?? 0) + 1;
    // autor
    const { data: prof } = await supabase.from("profiles").select("display_name").eq("user_id", userId).maybeSingle();
    await supabase.from("document_versions").insert({
      document_id: doc.id, user_id: userId, version_number: nextNum,
      title: doc.title, doc_type: doc.doc_type, category: doc.category,
      content: doc.content, url: doc.url,
      file_path: doc.file_path, file_name: doc.file_name, file_mime: doc.file_mime, file_size: doc.file_size,
      tags: doc.tags ?? [], company_id: doc.company_id, project_id: doc.project_id,
      change_note: changeNote ?? null,
      author_name: (prof as any)?.display_name ?? null,
    });
  };

  const updateDocument = useMutation({
    mutationFn: async ({ id, change_note, _skipSnapshot, ...patch }: Partial<DocItem> & { id: string; change_note?: string; _skipSnapshot?: boolean }) => {
      if (!_skipSnapshot) {
        const { data: current } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
        if (current) await snapshotVersion(current as DocItem, change_note);
      }
      const { data, error } = await supabase.from("documents").update(patch).eq("id", id).select().single();
      if (error) throw error; return data as DocItem;
    },
    onSuccess: () => inv(),
    onError: (e: any) => toast.error(e.message),
  });
  const removeDocument = useMutation({
    mutationFn: async (doc: DocItem) => {
      if (doc.file_path) { await supabase.storage.from("documents").remove([doc.file_path]); }
      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => { inv(); toast.success("Documento removido"); },
    onError: (e: any) => toast.error(e.message),
  });

  const uploadFile = async (
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<{ path: string; name: string; mime: string; size: number }> => {
    if (!userId) throw new Error("auth");
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${Date.now()}-${safe}`;

    // Try signed upload URL + XHR for real progress
    const signed = await supabase.storage.from("documents").createSignedUploadUrl(path);
    if (!signed.error && signed.data?.signedUrl) {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signed.data!.signedUrl, true);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("Falha de rede"));
        xhr.send(file);
      });
      onProgress?.(100);
      return { path, name: file.name, mime: file.type, size: file.size };
    }

    // Fallback (sem progresso real)
    onProgress?.(10);
    const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: false });
    if (error) throw error;
    onProgress?.(100);
    return { path, name: file.name, mime: file.type, size: file.size };
  };

  const getFileUrl = async (path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 60 * 10);
    if (error) return null;
    return data?.signedUrl ?? null;
  };

  const listVersions = async (documentId: string): Promise<DocVersion[]> => {
    const { data, error } = await supabase
      .from("document_versions").select("*")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false });
    if (error) { toast.error(error.message); return []; }
    return (data ?? []) as DocVersion[];
  };

  const restoreVersion = useMutation({
    mutationFn: async ({ documentId, version, currentDoc }: { documentId: string; version: DocVersion; currentDoc: DocItem }) => {
      // snapshot do estado atual antes de restaurar
      await snapshotVersion(currentDoc, `Antes de restaurar v${version.version_number}`);
      const patch = {
        title: version.title, doc_type: version.doc_type, category: version.category,
        content: version.content, url: version.url,
        file_path: version.file_path, file_name: version.file_name,
        file_mime: version.file_mime, file_size: version.file_size,
        tags: version.tags ?? [], company_id: version.company_id, project_id: version.project_id,
      };
      const { data, error } = await supabase.from("documents").update(patch).eq("id", documentId).select().single();
      if (error) throw error; return data as DocItem;
    },
    onSuccess: () => { inv(); toast.success("Versão restaurada"); },
    onError: (e: any) => toast.error(e.message),
  });

  return {
    companies, projects, documents,
    createCompany, updateCompany, removeCompany,
    createProject, updateProject, removeProject,
    createDocument, updateDocument, removeDocument,
    uploadFile, getFileUrl,
    listVersions, restoreVersion,
  };
}
