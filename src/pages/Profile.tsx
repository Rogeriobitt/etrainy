import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { User, Target, TrendingUp, Plus, Trash2 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import BioimpedanceSection from "@/components/BioimpedanceSection";

const chartConfig = {
  weight: {
    label: "Peso (kg)",
    color: "hsl(var(--primary))",
  },
};

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState({
    full_name: "",
    weight: "",
    height: "",
    goal: "",
    birth_date: "",
  });
  const [saving, setSaving] = useState(false);

  const [progressEntries, setProgressEntries] = useState<
    { id: string; weight: number; note: string | null; recorded_at: string }[]
  >([]);
  const [newWeight, setNewWeight] = useState("");
  const [newNote, setNewNote] = useState("");
  const [addingEntry, setAddingEntry] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
    fetchProgress();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single();
    if (data) {
      setProfile({
        full_name: data.full_name || "",
        weight: (data as any).weight?.toString() || "",
        height: (data as any).height?.toString() || "",
        goal: (data as any).goal || "",
        birth_date: (data as any).birth_date || "",
      });
    }
  };

  const fetchProgress = async () => {
    const { data } = await supabase
      .from("progress_entries" as any)
      .select("*")
      .eq("user_id", user!.id)
      .order("recorded_at", { ascending: true });
    if (data) setProgressEntries(data as any);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name || null,
        weight: profile.weight ? Number(profile.weight) : null,
        height: profile.height ? Number(profile.height) : null,
        goal: profile.goal || null,
        birth_date: profile.birth_date || null,
      } as any)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!" });
    }
  };

  const handleAddEntry = async () => {
    if (!user || !newWeight) return;
    setAddingEntry(true);
    const { error } = await supabase.from("progress_entries" as any).insert({
      user_id: user.id,
      weight: Number(newWeight),
      note: newNote || null,
    } as any);
    setAddingEntry(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setNewWeight("");
      setNewNote("");
      fetchProgress();
      toast({ title: "Registro adicionado!" });
    }
  };

  const handleDeleteEntry = async (id: string) => {
    await supabase.from("progress_entries" as any).delete().eq("id", id);
    fetchProgress();
  };

  const chartData = progressEntries.map((e) => ({
    date: new Date(e.recorded_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    weight: e.weight,
  }));

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-heading tracking-wider mb-8">
          MEU <span className="text-gradient">PERFIL</span>
        </h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Data */}
          <Card className="gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-heading tracking-wider">
                <User className="w-5 h-5 text-primary" /> DADOS PESSOAIS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="full_name">Nome completo</Label>
                <Input id="full_name" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="birth_date">Data de nascimento</Label>
                <Input id="birth_date" type="date" value={profile.birth_date} onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input id="weight" type="number" value={profile.weight} onChange={(e) => setProfile({ ...profile, weight: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input id="height" type="number" value={profile.height} onChange={(e) => setProfile({ ...profile, height: e.target.value })} />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={saving} className="w-full gradient-accent text-primary-foreground font-semibold">
                {saving ? "Salvando..." : "Salvar Dados"}
              </Button>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card className="gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-heading tracking-wider">
                <Target className="w-5 h-5 text-primary" /> MEUS OBJETIVOS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Ex: Perder 5kg em 3 meses, ganhar massa muscular, melhorar condicionamento..."
                value={profile.goal}
                onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
                className="min-h-[160px]"
              />
              <Button onClick={handleSaveProfile} disabled={saving} className="w-full gradient-accent text-primary-foreground font-semibold">
                {saving ? "Salvando..." : "Salvar Objetivos"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Progress Chart */}
        <Card className="gradient-card border-border/50 mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-heading tracking-wider">
              <TrendingUp className="w-5 h-5 text-primary" /> EVOLUÇÃO DE PESO
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 1 ? (
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={["dataMin - 2", "dataMax + 2"]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">
                Adicione pelo menos 2 registros de peso para ver o gráfico.
              </p>
            )}

            {/* Add entry */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Input type="number" placeholder="Peso (kg)" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} className="sm:w-32" />
              <Input placeholder="Observação (opcional)" value={newNote} onChange={(e) => setNewNote(e.target.value)} className="flex-1" />
              <Button onClick={handleAddEntry} disabled={addingEntry || !newWeight} className="gradient-accent text-primary-foreground font-semibold gap-2">
                <Plus className="w-4 h-4" /> Adicionar
              </Button>
            </div>

            {/* Entries list */}
            {progressEntries.length > 0 && (
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                {[...progressEntries].reverse().map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-2 text-sm">
                    <div>
                      <span className="font-semibold text-foreground">{entry.weight} kg</span>
                      <span className="text-muted-foreground ml-2">
                        {new Date(entry.recorded_at).toLocaleDateString("pt-BR")}
                      </span>
                      {entry.note && <span className="text-muted-foreground ml-2">— {entry.note}</span>}
                    </div>
                    <button onClick={() => handleDeleteEntry(entry.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Bioimpedance */}
        <BioimpedanceSection />
      </div>
    </div>
  );
};

export default Profile;
