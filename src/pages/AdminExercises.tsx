import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Dumbbell, Loader2, Search, Trash2, Upload } from "lucide-react";

interface ExerciseRow {
  id: string;
  name: string;
  muscle_group: string;
  equipment_type: string;
  suggested_level: string;
  image_url: string | null;
}

const MAX_BYTES = 5 * 1024 * 1024;

const AdminExercises = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<string>("__all__");
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const { data: exercises, isLoading } = useQuery({
    queryKey: ["admin-exercises"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("id, name, muscle_group, equipment_type, suggested_level, image_url")
        .order("muscle_group")
        .order("name");
      if (error) throw error;
      return data as ExerciseRow[];
    },
  });

  const groups = useMemo(() => {
    if (!exercises) return [];
    return Array.from(new Set(exercises.map((e) => e.muscle_group))).sort();
  }, [exercises]);

  const filtered = useMemo(() => {
    if (!exercises) return [];
    return exercises.filter((e) => {
      if (group !== "__all__" && e.muscle_group !== group) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [exercises, search, group]);

  const handleUpload = async (ex: ExerciseRow, file: File) => {
    if (file.size > MAX_BYTES) {
      toast({ title: "Arquivo muito grande", description: "Limite de 5 MB.", variant: "destructive" });
      return;
    }
    setUploadingId(ex.id);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${ex.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("exercise-images")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("exercise-images").getPublicUrl(path);

      const { error: updErr } = await supabase
        .from("exercises")
        .update({ image_url: urlData.publicUrl })
        .eq("id", ex.id);
      if (updErr) throw updErr;

      toast({ title: "Imagem atualizada!" });
      queryClient.invalidateQueries({ queryKey: ["admin-exercises"] });
      queryClient.invalidateQueries({ queryKey: ["exercise-image-map"] });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploadingId(null);
    }
  };

  const handleRemove = async (ex: ExerciseRow) => {
    if (!ex.image_url) return;
    if (!confirm(`Remover imagem de "${ex.name}"?`)) return;
    setUploadingId(ex.id);
    try {
      const { error } = await supabase
        .from("exercises")
        .update({ image_url: null })
        .eq("id", ex.id);
      if (error) throw error;
      toast({ title: "Imagem removida." });
      queryClient.invalidateQueries({ queryKey: ["admin-exercises"] });
      queryClient.invalidateQueries({ queryKey: ["exercise-image-map"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) return null;
  if (!user) {
    navigate("/auth");
    return null;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 pt-24 pb-12 text-center">
          <h1 className="text-3xl font-heading tracking-wider mb-4">ACESSO RESTRITO</h1>
          <p className="text-muted-foreground">Apenas administradores podem acessar esta página.</p>
          <Button onClick={() => navigate("/")} className="mt-6">Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-12 max-w-5xl">
        <button onClick={() => navigate("/admin/classes")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <h1 className="text-4xl md:text-5xl font-heading tracking-wider mb-2">
          CATÁLOGO DE <span className="text-gradient">EXERCÍCIOS</span>
        </h1>
        <p className="text-muted-foreground mb-8">
          Envie uma imagem por exercício. Ela aparecerá automaticamente na série de todos os alunos.
        </p>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar exercício..."
              className="pl-9"
            />
          </div>
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="__all__">Todos os grupos</option>
            {groups.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">Nenhum exercício encontrado.</div>
            )}
            {filtered.map((ex) => (
              <div key={ex.id} className="px-4 py-3 flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0 overflow-hidden">
                  {ex.image_url ? (
                    <img src={ex.image_url} alt={ex.name} className="w-full h-full object-cover" />
                  ) : (
                    <Dumbbell className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{ex.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">{ex.muscle_group}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{ex.equipment_type}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{ex.suggested_level}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className={`cursor-pointer inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border bg-secondary hover:bg-secondary/70 transition-colors ${uploadingId === ex.id ? "opacity-50 pointer-events-none" : ""}`}>
                    {uploadingId === ex.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {ex.image_url ? "Trocar" : "Enviar"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(ex, f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {ex.image_url && (
                    <button
                      onClick={() => handleRemove(ex)}
                      disabled={uploadingId === ex.id}
                      className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                      title="Remover imagem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminExercises;
