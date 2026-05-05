import { useEffect, useState } from "react";
import {
  FileText, FileSpreadsheet, FileVideo, FileAudio, FileArchive, FileCode,
  FileImage, FileType, File as FileIcon, Link2, StickyNote, Globe, Presentation, Database,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { DocItem } from "@/hooks/useDocs";

type Kind =
  | "pdf" | "doc" | "sheet" | "slides" | "image" | "video" | "audio"
  | "archive" | "code" | "data" | "font" | "text" | "link" | "note" | "file";

function detectKind(d: DocItem): Kind {
  if (d.doc_type === "link") return "link";
  if (d.doc_type === "text") return "note";
  const mime = (d.file_mime ?? "").toLowerCase();
  const name = (d.file_name ?? "").toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop()! : "";

  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (["doc", "docx", "odt", "rtf"].includes(ext) || mime.includes("word")) return "doc";
  if (["xls", "xlsx", "ods", "csv", "tsv"].includes(ext) || mime.includes("sheet") || mime.includes("excel") || mime === "text/csv") return "sheet";
  if (["ppt", "pptx", "odp", "key"].includes(ext) || mime.includes("presentation")) return "slides";
  if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(ext) || mime.includes("zip") || mime.includes("compressed")) return "archive";
  if (["json", "xml", "yml", "yaml", "sql", "db"].includes(ext) || mime.includes("json") || mime.includes("xml")) return "data";
  if (["js", "ts", "tsx", "jsx", "py", "rb", "go", "rs", "java", "c", "cpp", "cs", "php", "sh", "html", "css", "scss"].includes(ext) || mime.includes("javascript")) return "code";
  if (["ttf", "otf", "woff", "woff2"].includes(ext) || mime.includes("font")) return "font";
  if (mime.startsWith("text/") || ["txt", "md"].includes(ext)) return "text";
  return "file";
}

const KIND_CONFIG: Record<Kind, { Icon: any; label: string; hue: string; bg: string; ring: string }> = {
  pdf:     { Icon: FileText,        label: "PDF",   hue: "text-red-400",     bg: "bg-red-500/10",     ring: "ring-red-500/20" },
  doc:     { Icon: FileText,        label: "DOC",   hue: "text-blue-400",    bg: "bg-blue-500/10",    ring: "ring-blue-500/20" },
  sheet:   { Icon: FileSpreadsheet, label: "XLS",   hue: "text-emerald-400", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20" },
  slides:  { Icon: Presentation,    label: "PPT",   hue: "text-orange-400",  bg: "bg-orange-500/10",  ring: "ring-orange-500/20" },
  image:   { Icon: FileImage,       label: "IMG",   hue: "text-fuchsia-400", bg: "bg-fuchsia-500/10", ring: "ring-fuchsia-500/20" },
  video:   { Icon: FileVideo,       label: "VID",   hue: "text-pink-400",    bg: "bg-pink-500/10",    ring: "ring-pink-500/20" },
  audio:   { Icon: FileAudio,       label: "AUD",   hue: "text-purple-400",  bg: "bg-purple-500/10",  ring: "ring-purple-500/20" },
  archive: { Icon: FileArchive,     label: "ZIP",   hue: "text-amber-400",   bg: "bg-amber-500/10",   ring: "ring-amber-500/20" },
  code:    { Icon: FileCode,        label: "CODE",  hue: "text-cyan-400",    bg: "bg-cyan-500/10",    ring: "ring-cyan-500/20" },
  data:    { Icon: Database,        label: "DATA",  hue: "text-teal-400",    bg: "bg-teal-500/10",    ring: "ring-teal-500/20" },
  font:    { Icon: FileType,        label: "FONT",  hue: "text-indigo-400",  bg: "bg-indigo-500/10",  ring: "ring-indigo-500/20" },
  text:    { Icon: FileText,        label: "TXT",   hue: "text-slate-300",   bg: "bg-slate-500/10",   ring: "ring-slate-500/20" },
  link:    { Icon: Link2,           label: "LINK",  hue: "text-primary",     bg: "bg-primary/10",     ring: "ring-primary/20" },
  note:    { Icon: StickyNote,      label: "NOTE",  hue: "text-warning",     bg: "bg-warning/10",     ring: "ring-warning/20" },
  file:    { Icon: FileIcon,        label: "FILE",  hue: "text-muted-foreground", bg: "bg-secondary/60", ring: "ring-border" },
};

function getDomain(url: string | null) {
  if (!url) return null;
  try {
    const u = url.startsWith("http") ? url : `https://${url}`;
    return new URL(u).hostname.replace(/^www\./, "");
  } catch { return null; }
}

interface Props { doc: DocItem; size?: "sm" | "md" | "lg"; className?: string }

export function DocThumbnail({ doc, size = "md", className = "" }: Props) {
  const kind = detectKind(doc);
  const cfg = KIND_CONFIG[kind];
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgFail, setImgFail] = useState(false);

  const dim = size === "sm" ? "h-10 w-10" : size === "lg" ? "h-24 w-24" : "h-16 w-16";
  const iconSize = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-10 w-10" : "h-7 w-7";
  const labelSize = size === "sm" ? "text-[8px]" : "text-[9px]";

  // Image preview from storage
  useEffect(() => {
    let cancelled = false;
    setImgUrl(null); setImgFail(false);
    if (kind === "image" && doc.file_path) {
      supabase.storage.from("documents").createSignedUrl(doc.file_path, 60 * 30)
        .then(({ data }) => { if (!cancelled) setImgUrl(data?.signedUrl ?? null); });
    }
    return () => { cancelled = true; };
  }, [kind, doc.file_path]);

  // Link → favicon
  if (kind === "link") {
    const domain = getDomain(doc.url);
    const fav = domain ? `https://www.google.com/s2/favicons?sz=128&domain=${domain}` : null;
    return (
      <div className={`${dim} ${cfg.bg} ring-1 ${cfg.ring} rounded-lg flex items-center justify-center overflow-hidden shrink-0 relative ${className}`}>
        {fav && !imgFail ? (
          <img src={fav} alt="" className="h-1/2 w-1/2 object-contain" onError={() => setImgFail(true)} />
        ) : (
          <Globe className={`${iconSize} ${cfg.hue}`} />
        )}
        <span className={`absolute bottom-0 left-0 right-0 ${labelSize} font-mono text-center bg-background/70 backdrop-blur-sm ${cfg.hue} py-0.5 leading-none`}>
          LINK
        </span>
      </div>
    );
  }

  // Image preview
  if (kind === "image" && imgUrl && !imgFail) {
    return (
      <div className={`${dim} ring-1 ${cfg.ring} rounded-lg overflow-hidden shrink-0 relative bg-secondary/40 ${className}`}>
        <img src={imgUrl} alt={doc.title} className="w-full h-full object-cover" onError={() => setImgFail(true)} loading="lazy" />
        <span className={`absolute bottom-0 left-0 right-0 ${labelSize} font-mono text-center bg-background/70 backdrop-blur-sm text-foreground py-0.5 leading-none`}>
          IMG
        </span>
      </div>
    );
  }

  // Fallback: colored icon tile with extension label
  const ext = (doc.file_name ?? "").split(".").pop()?.toUpperCase().slice(0, 4);
  const label = (kind === "note" || kind === "text") ? cfg.label : (ext || cfg.label);

  return (
    <div className={`${dim} ${cfg.bg} ring-1 ${cfg.ring} rounded-lg flex flex-col items-center justify-center shrink-0 relative ${className}`}>
      <cfg.Icon className={`${iconSize} ${cfg.hue}`} strokeWidth={1.5} />
      <span className={`absolute bottom-0 left-0 right-0 ${labelSize} font-mono text-center bg-background/60 backdrop-blur-sm ${cfg.hue} py-0.5 leading-none truncate px-1`}>
        {label}
      </span>
    </div>
  );
}
