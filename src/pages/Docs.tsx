import { useMemo, useState } from "react";
import { useDocs, Company, DocProject, DocItem, DocType } from "@/hooks/useDocs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, FolderKanban, FileText, Link2, Paperclip, Plus, Search, Star,
  Trash2, Edit, ExternalLink, Download, ChevronRight, Folder, BookOpen, Globe
} from "lucide-react";
import { toast } from "sonner";

function getDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = url.startsWith("http") ? url : `https://${url}`;
    return new URL(u).hostname.replace(/^www\./, "");
  } catch { return null; }
}
function favicon(url: string | null) {
  const d = getDomain(url); return d ? `https://www.google.com/s2/favicons?sz=64&domain=${d}` : null;
}
function fmtSize(n: number | null) {
  if (!n) return ""; const k = 1024;
  if (n < k) return `${n} B`; if (n < k*k) return `${(n/k).toFixed(1)} KB`;
  return `${(n/k/k).toFixed(1)} MB`;
}

export default function Docs() {
  const {
    companies, projects, documents,
    createCompany, removeCompany,
    createProject, removeProject,
    createDocument, updateDocument, removeDocument,
    uploadFile, getFileUrl,
  } = useDocs();

  const [selectedCompany, setSelectedCompany] = useState<string | "all">("all");
  const [selectedProject, setSelectedProject] = useState<string | "all" | "none">("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [companyDlg, setCompanyDlg] = useState(false);
  const [projectDlg, setProjectDlg] = useState(false);
  const [docDlg, setDocDlg] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocItem | null>(null);

  // forms
  const [cName, setCName] = useState(""); const [cWebsite, setCWebsite] = useState(""); const [cDesc, setCDesc] = useState("");
  const [pName, setPName] = useState(""); const [pDesc, setPDesc] = useState(""); const [pCompany, setPCompany] = useState("");

  const [dTitle, setDTitle] = useState(""); const [dType, setDType] = useState<DocType>("text");
  const [dCompany, setDCompany] = useState<string>(""); const [dProject, setDProject] = useState<string>("");
  const [dCategory, setDCategory] = useState(""); const [dContent, setDContent] = useState("");
  const [dUrl, setDUrl] = useState(""); const [dTags, setDTags] = useState("");
  const [dFavorite, setDFavorite] = useState(false);
  const [dFile, setDFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const resetDoc = () => {
    setEditingDoc(null); setDTitle(""); setDType("text");
    setDCompany(selectedCompany !== "all" ? selectedCompany : "");
    setDProject(selectedProject !== "all" && selectedProject !== "none" ? selectedProject : "");
    setDCategory(""); setDContent(""); setDUrl(""); setDTags(""); setDFavorite(false); setDFile(null);
  };

  const openEditDoc = (d: DocItem) => {
    setEditingDoc(d); setDTitle(d.title); setDType(d.doc_type);
    setDCompany(d.company_id ?? ""); setDProject(d.project_id ?? "");
    setDCategory(d.category ?? ""); setDContent(d.content ?? ""); setDUrl(d.url ?? "");
    setDTags((d.tags ?? []).join(", ")); setDFavorite(d.favorite); setDFile(null);
    setDocDlg(true);
  };

  const projectsForCompany = (cid: string | null) =>
    (projects.data ?? []).filter(p => !cid || p.company_id === cid);

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (documents.data ?? []).filter(d => {
      if (selectedCompany !== "all" && d.company_id !== selectedCompany) return false;
      if (selectedProject === "none" && d.project_id !== null) return false;
      else if (selectedProject !== "all" && selectedProject !== "none" && d.project_id !== selectedProject) return false;
      if (typeFilter !== "all" && d.doc_type !== typeFilter) return false;
      if (q) {
        const hay = [d.title, d.category, d.content, d.url, d.file_name, ...(d.tags ?? [])].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [documents.data, selectedCompany, selectedProject, search, typeFilter]);

  const handleSaveDoc = async () => {
    if (!dTitle.trim()) { toast.error("Título é obrigatório"); return; }
    if (dType === "link" && !dUrl.trim()) { toast.error("URL é obrigatória"); return; }
    if (dType === "file" && !editingDoc && !dFile) { toast.error("Anexe um arquivo"); return; }

    let fileMeta: { file_path?: string; file_name?: string; file_mime?: string; file_size?: number } = {};
    if (dType === "file" && dFile) {
      try {
        setUploading(true);
        const u = await uploadFile(dFile);
        fileMeta = { file_path: u.path, file_name: u.name, file_mime: u.mime, file_size: u.size };
      } catch (e: any) { toast.error("Erro no upload: " + e.message); setUploading(false); return; }
      setUploading(false);
    }

    const payload: Partial<DocItem> = {
      title: dTitle.trim(),
      doc_type: dType,
      company_id: dCompany || null,
      project_id: dProject || null,
      category: dCategory || null,
      content: dType === "text" ? dContent : (dContent || null),
      url: dType === "link" ? dUrl.trim() : null,
      tags: dTags.split(",").map(t => t.trim()).filter(Boolean),
      favorite: dFavorite,
      ...fileMeta,
    };

    if (editingDoc) await updateDocument.mutateAsync({ id: editingDoc.id, ...payload });
    else await createDocument.mutateAsync(payload);
    setDocDlg(false); resetDoc();
  };

  const openFile = async (d: DocItem) => {
    if (!d.file_path) return;
    const url = await getFileUrl(d.file_path);
    if (url) window.open(url, "_blank");
    else toast.error("Não foi possível abrir o arquivo");
  };

  const isLoading = companies.isLoading || projects.isLoading || documents.isLoading;
  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-12 gap-4">
          <Skeleton className="col-span-3 h-96" /><Skeleton className="col-span-9 h-96" />
        </div>
      </div>
    );
  }

  const companyById = (id: string | null) => companies.data?.find(c => c.id === id) ?? null;
  const projectById = (id: string | null) => projects.data?.find(p => p.id === id) ?? null;

  const docCountByCompany = (cid: string) =>
    (documents.data ?? []).filter(d => d.company_id === cid).length;
  const docCountByProject = (pid: string) =>
    (documents.data ?? []).filter(d => d.project_id === pid).length;

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Documentação</h1>
          <p className="text-sm text-muted-foreground mt-1">Empresas → Projetos → Documentos. Tudo num só lugar.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setCName(""); setCWebsite(""); setCDesc(""); setCompanyDlg(true); }}>
            <Building2 className="h-3.5 w-3.5" /> Nova Empresa
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setPName(""); setPDesc(""); setPCompany(selectedCompany !== "all" ? selectedCompany : (companies.data?.[0]?.id ?? "")); setProjectDlg(true); }} disabled={!companies.data?.length}>
            <FolderKanban className="h-3.5 w-3.5" /> Novo Projeto
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => { resetDoc(); setDocDlg(true); }}>
            <Plus className="h-3.5 w-3.5" /> Novo Documento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-2 bg-card border border-border rounded-lg p-3 space-y-3 max-h-[78vh] overflow-y-auto">
          <button onClick={() => { setSelectedCompany("all"); setSelectedProject("all"); }}
            className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between ${selectedCompany === "all" ? "bg-primary/10 text-primary" : "hover:bg-secondary/50 text-foreground"}`}>
            <span className="flex items-center gap-2"><Folder className="h-3.5 w-3.5" /> Todas as empresas</span>
            <span className="text-[10px] text-muted-foreground">{documents.data?.length ?? 0}</span>
          </button>

          <div className="space-y-1">
            {(companies.data ?? []).map(c => {
              const isOpen = selectedCompany === c.id;
              const compProjects = projectsForCompany(c.id);
              return (
                <div key={c.id}>
                  <div className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer ${isOpen ? "bg-primary/10" : "hover:bg-secondary/50"}`}
                       onClick={() => { setSelectedCompany(c.id); setSelectedProject("all"); }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <ChevronRight className={`h-3 w-3 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                      {c.logo_url ? <img src={c.logo_url} alt="" className="h-4 w-4 rounded-sm" /> :
                        c.website ? <img src={favicon(c.website) ?? ""} alt="" className="h-4 w-4 rounded-sm" onError={(e) => (e.currentTarget.style.display = "none")} /> :
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className="text-xs font-medium truncate text-foreground">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{docCountByCompany(c.id)}</span>
                      <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); if (confirm(`Remover "${c.name}" e todos os projetos/documentos vinculados?`)) removeCompany.mutate(c.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-border/50 pl-2">
                      <button onClick={() => setSelectedProject("all")}
                        className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center justify-between ${selectedProject === "all" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                        <span>Todos</span>
                      </button>
                      {compProjects.map(p => (
                        <div key={p.id} className="group flex items-center justify-between gap-1">
                          <button onClick={() => setSelectedProject(p.id)}
                            className={`flex-1 text-left px-2 py-1 rounded text-[11px] flex items-center gap-1.5 ${selectedProject === p.id ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-secondary/50"}`}>
                            <FolderKanban className="h-3 w-3" />
                            <span className="truncate">{p.name}</span>
                            <span className="ml-auto text-[10px] text-muted-foreground">{docCountByProject(p.id)}</span>
                          </button>
                          <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1" onClick={() => { if (confirm(`Remover projeto "${p.name}" e seus documentos?`)) removeProject.mutate(p.id); }}>
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => setSelectedProject("none")}
                        className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center justify-between ${selectedProject === "none" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                        <span className="italic">Sem projeto</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {!companies.data?.length && (
              <p className="text-[11px] text-muted-foreground italic px-2 py-3 text-center">Crie sua primeira empresa</p>
            )}
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-12 md:col-span-9 space-y-4">
          <div className="flex flex-wrap items-center gap-2 p-3 bg-card border border-border rounded-lg">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar documentos…" className="pl-8 h-9 bg-secondary/50" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px] h-9 bg-secondary/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="text">Texto / Notas</SelectItem>
                <SelectItem value="link">Links externos</SelectItem>
                <SelectItem value="file">Arquivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-lg">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-sm font-medium text-foreground mb-1">Nenhum documento aqui ainda</h3>
              <p className="text-xs text-muted-foreground mb-4">Crie um documento, link ou anexe um arquivo</p>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { resetDoc(); setDocDlg(true); }}>
                <Plus className="h-3.5 w-3.5" /> Novo Documento
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredDocs.map(d => {
                const company = companyById(d.company_id);
                const project = projectById(d.project_id);
                const TypeIcon = d.doc_type === "link" ? Link2 : d.doc_type === "file" ? Paperclip : FileText;
                const fav = d.doc_type === "link" ? favicon(d.url) : null;
                return (
                  <div key={d.id} className="bg-card border border-border rounded-lg p-4 card-hover flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {fav ? <img src={fav} alt="" className="h-4 w-4 rounded-sm" onError={(e) => (e.currentTarget.style.display = "none")} /> : <TypeIcon className="h-4 w-4 text-primary shrink-0" />}
                        <span className="text-sm font-medium text-foreground truncate">{d.title}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => updateDocument.mutate({ id: d.id, favorite: !d.favorite })} className={`p-1 ${d.favorite ? "text-warning" : "text-muted-foreground hover:text-warning"}`}>
                          <Star className={`h-3 w-3 ${d.favorite ? "fill-current" : ""}`} />
                        </button>
                        <button onClick={() => openEditDoc(d)} className="p-1 text-muted-foreground hover:text-primary"><Edit className="h-3 w-3" /></button>
                        <button onClick={() => { if (confirm("Remover este documento?")) removeDocument.mutate(d); }} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-1 text-[10px] text-muted-foreground">
                      {company && <span className="bg-secondary/50 px-1.5 py-0.5 rounded flex items-center gap-1"><Building2 className="h-2.5 w-2.5" />{company.name}</span>}
                      {project && <span className="bg-secondary/50 px-1.5 py-0.5 rounded flex items-center gap-1"><FolderKanban className="h-2.5 w-2.5" />{project.name}</span>}
                      {d.category && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">{d.category}</span>}
                    </div>

                    {d.doc_type === "text" && d.content && (
                      <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">{d.content}</p>
                    )}
                    {d.doc_type === "link" && d.url && (
                      <a href={d.url.startsWith("http") ? d.url : `https://${d.url}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate flex items-center gap-1">
                        <Globe className="h-3 w-3" />{getDomain(d.url) ?? d.url}<ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                    {d.doc_type === "file" && d.file_path && (
                      <button onClick={() => openFile(d)} className="text-xs text-primary hover:underline flex items-center gap-1 truncate">
                        <Download className="h-3 w-3" />{d.file_name} <span className="text-muted-foreground">({fmtSize(d.file_size)})</span>
                      </button>
                    )}

                    {d.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {d.tags.map(t => <span key={t} className="text-[10px] bg-secondary/50 px-1.5 py-0.5 rounded text-muted-foreground">#{t}</span>)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Company dialog */}
      <Dialog open={companyDlg} onOpenChange={setCompanyDlg}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nova Empresa</DialogTitle><DialogDescription>Cadastre uma empresa para organizar seus documentos.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">Nome *</Label><Input value={cName} onChange={e => setCName(e.target.value)} className="bg-secondary/50" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Website</Label><Input value={cWebsite} onChange={e => setCWebsite(e.target.value)} placeholder="https://" className="bg-secondary/50" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Descrição</Label><Textarea value={cDesc} onChange={e => setCDesc(e.target.value)} className="bg-secondary/50" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompanyDlg(false)}>Cancelar</Button>
            <Button onClick={async () => { if (!cName.trim()) { toast.error("Nome obrigatório"); return; } await createCompany.mutateAsync({ name: cName.trim(), website: cWebsite || null, description: cDesc || null }); setCompanyDlg(false); }}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project dialog */}
      <Dialog open={projectDlg} onOpenChange={setProjectDlg}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Projeto</DialogTitle><DialogDescription>Vincule a uma empresa.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Empresa *</Label>
              <Select value={pCompany} onValueChange={setPCompany}>
                <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{companies.data?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Nome *</Label><Input value={pName} onChange={e => setPName(e.target.value)} className="bg-secondary/50" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Descrição</Label><Textarea value={pDesc} onChange={e => setPDesc(e.target.value)} className="bg-secondary/50" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectDlg(false)}>Cancelar</Button>
            <Button onClick={async () => { if (!pName.trim() || !pCompany) { toast.error("Empresa e nome obrigatórios"); return; } await createProject.mutateAsync({ company_id: pCompany, name: pName.trim(), description: pDesc || null }); setProjectDlg(false); }}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document dialog */}
      <Dialog open={docDlg} onOpenChange={open => { if (!open) { setDocDlg(false); resetDoc(); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDoc ? "Editar Documento" : "Novo Documento"}</DialogTitle>
            <DialogDescription>Texto, link externo ou arquivo — sempre vinculado a uma empresa/projeto.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo</Label>
                <Select value={dType} onValueChange={(v) => setDType(v as DocType)}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto / Notas</SelectItem>
                    <SelectItem value="link">Link externo</SelectItem>
                    <SelectItem value="file">Arquivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs">Título *</Label>
                <Input value={dTitle} onChange={e => setDTitle(e.target.value)} className="bg-secondary/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Empresa</Label>
                <Select value={dCompany || "none"} onValueChange={v => { setDCompany(v === "none" ? "" : v); setDProject(""); }}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Nenhuma —</SelectItem>
                    {companies.data?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Projeto</Label>
                <Select value={dProject || "none"} onValueChange={v => setDProject(v === "none" ? "" : v)} disabled={!dCompany}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={dCompany ? "Selecione" : "Escolha uma empresa"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Nenhum —</SelectItem>
                    {projectsForCompany(dCompany || null).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Categoria</Label><Input value={dCategory} onChange={e => setDCategory(e.target.value)} placeholder="ex: contrato, runbook" className="bg-secondary/50" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Tags (vírgula)</Label><Input value={dTags} onChange={e => setDTags(e.target.value)} className="bg-secondary/50" /></div>
            </div>

            {dType === "link" && (
              <div className="space-y-1.5"><Label className="text-xs">URL *</Label><Input value={dUrl} onChange={e => setDUrl(e.target.value)} placeholder="https://" className="bg-secondary/50" /></div>
            )}
            {dType === "file" && (
              <div className="space-y-1.5">
                <Label className="text-xs">{editingDoc?.file_path ? "Substituir arquivo (opcional)" : "Arquivo *"}</Label>
                <Input type="file" onChange={e => setDFile(e.target.files?.[0] ?? null)} className="bg-secondary/50" />
                {editingDoc?.file_name && <p className="text-[11px] text-muted-foreground">Atual: {editingDoc.file_name}</p>}
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">{dType === "text" ? "Conteúdo" : "Notas"}</Label>
              <Textarea value={dContent} onChange={e => setDContent(e.target.value)} className="bg-secondary/50 min-h-[140px]" />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={dFavorite} onChange={e => setDFavorite(e.target.checked)} /> Marcar como favorito
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDocDlg(false); resetDoc(); }}>Cancelar</Button>
            <Button onClick={handleSaveDoc} disabled={uploading || createDocument.isPending || updateDocument.isPending}>
              {uploading ? "Enviando…" : editingDoc ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
