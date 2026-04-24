import { useMemo, useState } from "react";
import {
  Link2,
  Plus,
  Search,
  Star,
  StarOff,
  Trash2,
  ExternalLink,
  Loader2,
  Globe,
  Wrench,
  BookOpen,
  Brain,
  Pencil,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  useUsefulLinks,
  type LinkType,
  type UsefulLink,
} from "@/hooks/useUsefulLinks";

const TYPE_META: Record<
  LinkType,
  { label: string; icon: typeof Globe; tone: string }
> = {
  site: { label: "Site", icon: Globe, tone: "text-primary" },
  ferramenta: { label: "Ferramenta", icon: Wrench, tone: "text-accent-foreground" },
  doc: { label: "Documentação", icon: BookOpen, tone: "text-muted-foreground" },
  memoria: { label: "Memória", icon: Brain, tone: "text-primary" },
};

const TYPE_ORDER: LinkType[] = ["site", "ferramenta", "doc", "memoria"];

const FILTERS: { key: "all" | "favorite" | LinkType; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "favorite", label: "Favoritos" },
  { key: "site", label: "Sites" },
  { key: "ferramenta", label: "Ferramentas" },
  { key: "doc", label: "Documentação" },
  { key: "memoria", label: "Memórias" },
];

const emptyForm = {
  title: "",
  url: "",
  description: "",
  link_type: "site" as LinkType,
  category: "",
  favorite: false,
};

function getDomain(url: string) {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    return null;
  }
}

function getFavicon(url: string) {
  const domain = getDomain(url);
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function normalizeUrl(url: string) {
  if (!url) return url;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export default function UsefulLinks() {
  const { list, create, update, remove } = useUsefulLinks();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UsefulLink | null>(null);
  const [form, setForm] = useState(emptyForm);

  const links = list.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return links.filter((l) => {
      if (filter === "favorite" && !l.favorite) return false;
      if (filter !== "all" && filter !== "favorite" && l.link_type !== filter)
        return false;
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q) ||
        (l.description ?? "").toLowerCase().includes(q) ||
        (l.category ?? "").toLowerCase().includes(q)
      );
    });
  }, [links, search, filter]);

  const grouped = useMemo(() => {
    const map = new Map<LinkType, UsefulLink[]>();
    for (const t of TYPE_ORDER) map.set(t, []);
    for (const l of filtered) {
      const arr = map.get(l.link_type) ?? [];
      arr.push(l);
      map.set(l.link_type, arr);
    }
    return TYPE_ORDER.map((t) => ({ type: t, items: map.get(t) ?? [] })).filter(
      (g) => g.items.length > 0,
    );
  }, [filtered]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (l: UsefulLink) => {
    setEditing(l);
    setForm({
      title: l.title,
      url: l.url,
      description: l.description ?? "",
      link_type: l.link_type,
      category: l.category ?? "",
      favorite: l.favorite,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.url.trim()) return;
    const payload = {
      title: form.title.trim(),
      url: normalizeUrl(form.url.trim()),
      description: form.description.trim() || null,
      link_type: form.link_type,
      category: form.category.trim() || null,
      favorite: form.favorite,
    };
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const toggleFavorite = (l: UsefulLink) =>
    update.mutate({ id: l.id, favorite: !l.favorite });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Links Úteis</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Acesso rápido a sites, ferramentas, documentações e memórias
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Novo link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar link" : "Novo link"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="link-title">Título</Label>
                <Input
                  id="link-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex.: Painel AWS"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select
                    value={form.link_type}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, link_type: v as LinkType }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_ORDER.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TYPE_META[t].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="link-cat">Categoria</Label>
                  <Input
                    id="link-cat"
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="link-desc">Descrição</Label>
                <Textarea
                  id="link-desc"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Notas rápidas (opcional)"
                  rows={3}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.favorite}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, favorite: e.target.checked }))
                  }
                  className="accent-primary"
                />
                Marcar como favorito
              </label>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !form.title.trim() ||
                  !form.url.trim() ||
                  create.isPending ||
                  update.isPending
                }
              >
                {(create.isPending || update.isPending) && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                )}
                {editing ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, URL, categoria..."
            className="pl-8 h-9 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider border transition-colors ${
                filter === f.key
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {list.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg py-16 flex flex-col items-center text-center gap-2">
          <Link2 className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {links.length === 0
              ? "Nenhum link cadastrado ainda."
              : "Nenhum link corresponde aos filtros."}
          </p>
          {links.length === 0 && (
            <Button onClick={openCreate} variant="ghost" size="sm" className="mt-2 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Adicionar o primeiro link
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8 canvas-stagger">
          {grouped.map(({ type, items }) => {
            const Meta = TYPE_META[type];
            const Icon = Meta.icon;
            return (
              <section key={type} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 ${Meta.tone}`} />
                  <h2 className="text-[11px] font-mono tracking-[0.18em] uppercase text-muted-foreground">
                    {Meta.label}
                  </h2>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    [{items.length}]
                  </span>
                  <div className="separator-glow flex-1 ml-2" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {items.map((l) => (
                    <LinkCard
                      key={l.id}
                      link={l}
                      onToggleFavorite={() => toggleFavorite(l)}
                      onEdit={() => openEdit(l)}
                      onDelete={() => remove.mutate(l.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LinkCard({
  link,
  onToggleFavorite,
  onEdit,
  onDelete,
}: {
  link: UsefulLink;
  onToggleFavorite: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const favicon = getFavicon(link.url);
  const domain = getDomain(link.url);
  const Meta = TYPE_META[link.link_type];
  const Icon = Meta.icon;

  return (
    <div className="group relative bg-card border border-border rounded-lg p-3.5 card-hover overflow-hidden">
      <a
        href={link.url}
        target="_blank"
        rel="noreferrer noopener"
        className="block space-y-2.5"
      >
        <div className="flex items-start gap-2.5">
          <div className="h-9 w-9 rounded-md bg-secondary/60 border border-border/60 flex items-center justify-center shrink-0 overflow-hidden">
            {favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={favicon}
                alt=""
                className="h-5 w-5"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  const fallback = e.currentTarget
                    .nextElementSibling as HTMLElement | null;
                  if (fallback) fallback.style.display = "block";
                }}
              />
            ) : null}
            <Icon
              className={`h-4 w-4 ${Meta.tone}`}
              style={{ display: favicon ? "none" : "block" }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-medium text-foreground truncate">
                {link.title}
              </h3>
              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
            {domain && (
              <p className="text-[10px] font-mono text-muted-foreground truncate">
                {domain}
              </p>
            )}
          </div>
        </div>

        {link.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {link.description}
          </p>
        )}

        <div className="flex items-center gap-1.5 flex-wrap">
          {link.category && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary/60 text-muted-foreground border border-border/60">
              {link.category}
            </span>
          )}
        </div>
      </a>

      {/* Actions */}
      <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onToggleFavorite}
          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-primary"
          title={link.favorite ? "Remover dos favoritos" : "Marcar como favorito"}
        >
          {link.favorite ? (
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
          ) : (
            <StarOff className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          onClick={onEdit}
          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          title="Remover"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {link.favorite && (
        <div className="absolute top-2 left-2 group-hover:opacity-0 transition-opacity">
          <Star className="h-3 w-3 fill-primary text-primary" />
        </div>
      )}
    </div>
  );
}
