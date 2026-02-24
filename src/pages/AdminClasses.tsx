import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Loader2, ArrowLeft } from "lucide-react";

interface VideoClass {
  id: string;
  title: string;
  description: string | null;
  duration: string;
  calories: string | null;
  tag: string;
  video_url: string;
  thumbnail_url: string | null;
  created_by: string;
  created_at: string;
}

const AdminClasses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [tag, setTag] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: classes, isLoading } = useQuery({
    queryKey: ["admin-video-classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_classes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as VideoClass[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("video_classes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-video-classes"] });
      queryClient.invalidateQueries({ queryKey: ["video-classes"] });
      toast({ title: "Aula removida com sucesso!" });
    },
  });

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !title || !duration || !tag) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // Upload video
      const videoExt = videoFile.name.split(".").pop();
      const videoPath = `${crypto.randomUUID()}.${videoExt}`;
      const { error: videoError } = await supabase.storage
        .from("class-videos")
        .upload(videoPath, videoFile);
      if (videoError) throw videoError;

      const { data: videoUrlData } = supabase.storage
        .from("class-videos")
        .getPublicUrl(videoPath);

      // Upload thumbnail if provided
      let thumbnailUrl: string | null = null;
      if (thumbnailFile) {
        const thumbExt = thumbnailFile.name.split(".").pop();
        const thumbPath = `${crypto.randomUUID()}.${thumbExt}`;
        const { error: thumbError } = await supabase.storage
          .from("class-thumbnails")
          .upload(thumbPath, thumbnailFile);
        if (thumbError) throw thumbError;

        const { data: thumbUrlData } = supabase.storage
          .from("class-thumbnails")
          .getPublicUrl(thumbPath);
        thumbnailUrl = thumbUrlData.publicUrl;
      }

      // Insert record
      const { error: insertError } = await supabase.from("video_classes").insert({
        title,
        description: description || null,
        duration,
        calories: calories || null,
        tag,
        video_url: videoUrlData.publicUrl,
        thumbnail_url: thumbnailUrl,
        created_by: user.id,
      });
      if (insertError) throw insertError;

      toast({ title: "Aula cadastrada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["admin-video-classes"] });
      queryClient.invalidateQueries({ queryKey: ["video-classes"] });

      // Reset form
      setTitle("");
      setDescription("");
      setDuration("");
      setCalories("");
      setTag("");
      setVideoFile(null);
      setThumbnailFile(null);
    } catch (err: any) {
      toast({ title: "Erro ao cadastrar aula", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-12">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <h1 className="text-4xl md:text-5xl font-heading tracking-wider mb-8">
          GERENCIAR <span className="text-gradient">AULAS</span>
        </h1>

        {/* Upload Form */}
        <div className="bg-card rounded-xl p-6 md:p-8 border border-border mb-12">
          <h2 className="text-2xl font-heading tracking-wide mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Nova Aula
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Yoga Flow" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag">Categoria *</Label>
              <Select value={tag} onValueChange={setTag} required>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cardio">Cardio</SelectItem>
                  <SelectItem value="Força">Força</SelectItem>
                  <SelectItem value="Flexibilidade">Flexibilidade</SelectItem>
                  <SelectItem value="Recuperação">Recuperação</SelectItem>
                  <SelectItem value="HIIT">HIIT</SelectItem>
                  <SelectItem value="Funcional">Funcional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duração *</Label>
              <Input id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Ex: 30 min" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calories">Calorias</Label>
              <Input id="calories" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="Ex: 150 kcal" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva a aula..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video">Vídeo (MP4, máx. 50MB) *</Label>
              <Input id="video" type="file" accept="video/mp4,video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail (imagem)</Label>
              <Input id="thumbnail" type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={uploading} className="gradient-accent text-primary-foreground font-semibold px-8">
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : "Cadastrar Aula"}
              </Button>
            </div>
          </form>
        </div>

        {/* Classes List */}
        <h2 className="text-2xl font-heading tracking-wide mb-6">Aulas Cadastradas</h2>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : !classes?.length ? (
          <p className="text-muted-foreground">Nenhuma aula cadastrada ainda.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div key={cls.id} className="bg-card rounded-xl border border-border overflow-hidden">
                {cls.thumbnail_url ? (
                  <img src={cls.thumbnail_url} alt={cls.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-secondary flex items-center justify-center text-muted-foreground">Sem thumbnail</div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-primary">{cls.tag}</span>
                      <h3 className="text-lg font-heading tracking-wide">{cls.title}</h3>
                      <p className="text-sm text-muted-foreground">{cls.duration} {cls.calories && `· ${cls.calories}`}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(cls.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminClasses;
