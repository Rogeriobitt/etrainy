import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Loader2, ArrowLeft, Wand2, Film, Image as ImageIcon } from "lucide-react";

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

interface VideoMeta {
  width: number;
  height: number;
  duration: number;
  sizeMB: number;
  aspectOk: boolean;
}

const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp"];
const MAX_THUMB_BYTES = 1024 * 1024; // 1 MB

const AdminClasses = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [tag, setTag] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>("");
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [generatingThumb, setGeneratingThumb] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

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
          <Button onClick={() => navigate("/")} className="mt-6 gradient-accent text-primary-foreground font-semibold">
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setTitle(""); setDescription(""); setDuration(""); setCalories(""); setTag("");
    setVideoFile(null); setVideoMeta(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl("");
    setThumbnailFile(null);
    if (thumbPreviewUrl) URL.revokeObjectURL(thumbPreviewUrl);
    setThumbPreviewUrl("");
    setUploadProgress(0);
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (thumbInputRef.current) thumbInputRef.current.value = "";
  };

  const handleVideoSelect = (file: File | null) => {
    if (!file) return;
    if (!ALLOWED_VIDEO.includes(file.type)) {
      toast({ title: "Formato inválido", description: "Use MP4, WebM ou MOV.", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(file);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(url);
    setVideoFile(file);

    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;
    v.onloadedmetadata = () => {
      const w = v.videoWidth, h = v.videoHeight;
      const ratio = w / h;
      const aspectOk = Math.abs(ratio - 16 / 9) / (16 / 9) <= 0.02;
      const sizeMB = file.size / (1024 * 1024);
      setVideoMeta({ width: w, height: h, duration: v.duration, sizeMB, aspectOk });
      if (!aspectOk) {
        toast({
          title: "Proporção não é 16:9",
          description: `Vídeo ${w}×${h}. Recomendamos enviar em 16:9 para melhor exibição.`,
        });
      }
      if (!duration) {
        const mins = Math.max(1, Math.round(v.duration / 60));
        setDuration(`${mins} min`);
      }
    };
  };

  const handleThumbSelect = (file: File | null) => {
    if (!file) return;
    if (!ALLOWED_IMAGE.includes(file.type)) {
      toast({ title: "Formato inválido", description: "Use JPG, PNG ou WebP.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_THUMB_BYTES) {
      toast({ title: "Thumbnail muito grande", description: "Máximo 1 MB.", variant: "destructive" });
      return;
    }
    if (thumbPreviewUrl) URL.revokeObjectURL(thumbPreviewUrl);
    const url = URL.createObjectURL(file);
    setThumbPreviewUrl(url);
    setThumbnailFile(file);

    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      if (Math.abs(ratio - 16 / 9) / (16 / 9) > 0.02) {
        toast({
          title: "Thumbnail não é 16:9",
          description: `Imagem ${img.width}×${img.height}. Ideal: 1280×720.`,
        });
      }
    };
    img.src = url;
  };

  const generateThumbnail = async () => {
    if (!videoFile || !videoPreviewUrl) return;
    setGeneratingThumb(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        const v = document.createElement("video");
        v.preload = "auto";
        v.muted = true;
        v.crossOrigin = "anonymous";
        v.src = videoPreviewUrl;
        v.onloadedmetadata = () => {
          const target = Math.min(2, (v.duration || 0) * 0.1);
          v.currentTime = target;
        };
        v.onseeked = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 1280;
          canvas.height = 720;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas indisponível"));
          // letterbox to keep aspect
          const vr = v.videoWidth / v.videoHeight;
          const cr = 16 / 9;
          let dw = canvas.width, dh = canvas.height, dx = 0, dy = 0;
          if (vr > cr) { dh = canvas.width / vr; dy = (canvas.height - dh) / 2; }
          else if (vr < cr) { dw = canvas.height * vr; dx = (canvas.width - dw) / 2; }
          ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(v, dx, dy, dw, dh);
          canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Falha ao gerar")), "image/jpeg", 0.85);
        };
        v.onerror = () => reject(new Error("Erro ao ler vídeo"));
      });
      const file = new File([blob], `thumb-${Date.now()}.jpg`, { type: "image/jpeg" });
      if (thumbPreviewUrl) URL.revokeObjectURL(thumbPreviewUrl);
      setThumbPreviewUrl(URL.createObjectURL(blob));
      setThumbnailFile(file);
      toast({ title: "Thumbnail gerada!" });
    } catch (err: any) {
      toast({ title: "Erro ao gerar thumbnail", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingThumb(false);
    }
  };

  const uploadWithProgress = async (bucket: string, path: string, file: File) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Sessão expirada");
    const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("x-upsert", "false");
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload falhou (${xhr.status}): ${xhr.responseText}`));
      };
      xhr.onerror = () => reject(new Error("Erro de rede no upload"));
      xhr.send(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !title || !duration || !tag) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const videoExt = videoFile.name.split(".").pop();
      const videoPath = `${crypto.randomUUID()}.${videoExt}`;
      await uploadWithProgress("class-videos", videoPath, videoFile);
      const { data: videoUrlData } = supabase.storage.from("class-videos").getPublicUrl(videoPath);

      let thumbnailUrl: string | null = null;
      if (thumbnailFile) {
        const thumbExt = thumbnailFile.name.split(".").pop();
        const thumbPath = `${crypto.randomUUID()}.${thumbExt}`;
        const { error: thumbError } = await supabase.storage
          .from("class-thumbnails")
          .upload(thumbPath, thumbnailFile);
        if (thumbError) throw thumbError;
        const { data: thumbUrlData } = supabase.storage.from("class-thumbnails").getPublicUrl(thumbPath);
        thumbnailUrl = thumbUrlData.publicUrl;
      }

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
      resetForm();
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

        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <h1 className="text-4xl md:text-5xl font-heading tracking-wider">
            GERENCIAR <span className="text-gradient">AULAS</span>
          </h1>
          <Button variant="outline" onClick={() => navigate("/admin/exercises")}>
            Catálogo de exercícios
          </Button>
        </div>

        <div className="bg-card rounded-xl p-6 md:p-8 border border-border mb-12">
          <h2 className="text-2xl font-heading tracking-wide mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Nova Aula
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coluna 1 — metadados */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Yoga Flow" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="calories">Calorias</Label>
                <Input id="calories" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="Ex: 150 kcal" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva a aula..." rows={4} />
              </div>
            </div>

            {/* Coluna 2 — mídia */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="video" className="flex items-center gap-2"><Film className="w-4 h-4" /> Vídeo (MP4/WebM/MOV, 16:9) *</Label>
                <Input id="video" ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime"
                  onChange={(e) => handleVideoSelect(e.target.files?.[0] || null)} required />
                <p className="text-xs text-muted-foreground">
                  Recomendado: 1080p (1920×1080), 30 fps, ~5 Mbps, áudio AAC. Codec H.264.
                </p>
                {videoMeta && (
                  <p className="text-xs text-muted-foreground">
                    {videoMeta.width}×{videoMeta.height} · {Math.round(videoMeta.duration)}s · {videoMeta.sizeMB.toFixed(1)} MB
                    {!videoMeta.aspectOk && <span className="text-destructive"> · não é 16:9</span>}
                  </p>
                )}
                {videoPreviewUrl && (
                  <video src={videoPreviewUrl} controls className="w-full rounded-md border border-border max-h-56 bg-black" />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Label htmlFor="thumbnail" className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Thumbnail (16:9, máx. 1 MB)</Label>
                  <Button type="button" variant="outline" size="sm" disabled={!videoFile || generatingThumb}
                    onClick={generateThumbnail}>
                    {generatingThumb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    Gerar do vídeo
                  </Button>
                </div>
                <Input id="thumbnail" ref={thumbInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleThumbSelect(e.target.files?.[0] || null)} />
                {thumbPreviewUrl && (
                  <img src={thumbPreviewUrl} alt="Preview da thumbnail" className="w-full rounded-md border border-border max-h-48 object-contain bg-black" />
                )}
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Enviando vídeo...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <Button type="submit" disabled={uploading} className="gradient-accent text-primary-foreground font-semibold px-8 w-full">
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : "Cadastrar Aula"}
              </Button>
            </div>
          </form>
        </div>

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
