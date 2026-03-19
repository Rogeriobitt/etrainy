import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Trash2, ExternalLink, Loader2 } from "lucide-react";

interface BioUpload {
  id: string;
  file_name: string;
  file_url: string;
  notes: string | null;
  uploaded_at: string;
}

const BioimpedanceSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploads, setUploads] = useState<BioUpload[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) fetchUploads();
  }, [user]);

  const fetchUploads = async () => {
    const { data } = await supabase
      .from("bioimpedance_uploads")
      .select("*")
      .eq("user_id", user!.id)
      .order("uploaded_at", { ascending: false });
    if (data) setUploads(data as BioUpload[]);
  };

  const handleUpload = async () => {
    if (!user || !file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Apenas arquivos PDF são permitidos", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande (máx. 10MB)", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const filePath = `${user.id}/${crypto.randomUUID()}.pdf`;
      const { error: storageError } = await supabase.storage
        .from("bioimpedance")
        .upload(filePath, file);
      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage
        .from("bioimpedance")
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("bioimpedance_uploads").insert({
        user_id: user.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        notes: notes || null,
      });
      if (dbError) throw dbError;

      setFile(null);
      setNotes("");
      fetchUploads();
      toast({ title: "Bioimpedância enviada com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (upload: BioUpload) => {
    // Extract path from URL
    const urlParts = upload.file_url.split("/bioimpedance/");
    const storagePath = urlParts[urlParts.length - 1];
    
    await supabase.storage.from("bioimpedance").remove([storagePath]);
    await supabase.from("bioimpedance_uploads").delete().eq("id", upload.id);
    fetchUploads();
    toast({ title: "Arquivo removido!" });
  };

  const getSignedUrl = async (upload: BioUpload) => {
    const urlParts = upload.file_url.split("/bioimpedance/");
    const storagePath = urlParts[urlParts.length - 1];
    const { data } = await supabase.storage
      .from("bioimpedance")
      .createSignedUrl(storagePath, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  return (
    <Card className="gradient-card border-border/50 mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-heading tracking-wider">
          <FileText className="w-5 h-5 text-primary" /> BIOIMPEDÂNCIA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm mb-4">
          Envie seus exames de bioimpedância em PDF para acompanhar sua evolução corporal.
        </p>

        {/* Upload form */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="flex-1"
          />
          <Input
            placeholder="Observação (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="sm:w-48"
          />
          <Button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="gradient-accent text-primary-foreground font-semibold gap-2"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Enviar
          </Button>
        </div>

        {/* Uploads list */}
        {uploads.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploads.map((upload) => (
              <div key={upload.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-3 text-sm">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{upload.file_name}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(upload.uploaded_at).toLocaleDateString("pt-BR")}
                      {upload.notes && ` — ${upload.notes}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => getSignedUrl(upload)} className="text-primary hover:text-primary">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(upload)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-4">
            Nenhum exame enviado ainda.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BioimpedanceSection;
