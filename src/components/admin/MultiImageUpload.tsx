import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
};

const MultiImageUpload = ({ value, onChange, folder = "products" }: Props) => {
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} je veće od 5MB`);
          continue;
        }
        const ext = file.name.split(".").pop();
        const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from("media").upload(path, file);
        if (error) { toast.error(error.message); continue; }
        const { data } = supabase.storage.from("media").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      if (uploaded.length) {
        onChange([...value, ...uploaded]);
        toast.success(`${uploaded.length} slika učitano`);
      }
    } finally {
      setUploading(false);
    }
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {value.map((url, i) => (
          <div key={i} className="relative">
            <img src={url} alt="" className="w-24 h-24 object-cover border border-border" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute -top-2 -right-2 bg-foreground text-background p-1 rounded-full"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        <label className="flex items-center justify-center w-24 h-24 border-2 border-dashed border-border cursor-pointer hover:bg-[#FAFAF8]">
          {uploading ? <Loader2 size={18} className="animate-spin text-muted-foreground" /> : <Plus size={18} className="text-muted-foreground" />}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }}
          />
        </label>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2 font-body">Klikni + za dodavanje. Maks 5MB po slici.</p>
    </div>
  );
};

export default MultiImageUpload;
