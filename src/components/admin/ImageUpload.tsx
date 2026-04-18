import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
};

const ImageUpload = ({ value, onChange, folder = "uploads", label }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value || "");

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Samo slike su dozvoljene");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Maks 5MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      onChange(data.publicUrl);
      setUrlInput(data.publicUrl);
      toast.success("Slika učitana");
    } catch (e: any) {
      toast.error("Greška: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {label && <span className="block text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5 font-body">{label}</span>}
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="" className="w-32 h-32 object-cover border border-border" />
          <button
            type="button"
            onClick={() => { onChange(""); setUrlInput(""); }}
            className="absolute -top-2 -right-2 bg-foreground text-background p-1 rounded-full"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <label className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-border cursor-pointer hover:bg-[#FAFAF8] transition-colors">
          {uploading ? <Loader2 size={20} className="animate-spin text-muted-foreground" /> : <Upload size={20} className="text-muted-foreground" />}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </label>
      )}
      <div className="mt-2">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => { setUrlInput(e.target.value); onChange(e.target.value); }}
          placeholder="ili nalepi URL slike"
          className="w-full px-3 py-2 border border-border font-body text-xs"
        />
      </div>
    </div>
  );
};

export default ImageUpload;
