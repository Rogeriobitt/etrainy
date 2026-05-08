import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Copy, Check, Mail, UserPlus, Link2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personalTrainerId: string;
  personalName: string;
}

const AddStudentModal = ({ open, onOpenChange, personalTrainerId, personalName }: Props) => {
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const inputClass =
    "w-full bg-secondary border border-border rounded-lg py-3 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-body text-sm";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !studentEmail) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("student_invitations" as any)
        .insert({
          personal_trainer_id: personalTrainerId,
          personal_name: personalName,
          student_name: studentName,
          student_email: studentEmail,
        } as any)
        .select("token")
        .single();

      if (error) throw error;
      const token = (data as any).token;
      const link = `${window.location.origin}/convite/${token}`;
      setInviteLink(link);
    } catch (err: any) {
      toast({ title: "Erro ao criar convite", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendEmail = async () => {
    // For now, just copy and show a message. Email sending can be wired later.
    toast({ title: "Funcionalidade de e-mail será habilitada em breve. Por enquanto, copie o link e envie manualmente." });
    setEmailSent(true);
  };

  const handleClose = () => {
    setStudentName("");
    setStudentEmail("");
    setInviteLink(null);
    setCopied(false);
    setEmailSent(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading tracking-wider text-lg">
            {inviteLink ? (
              <span className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" />
                Link de convite
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Adicionar aluno
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {!inviteLink ? (
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <input
              type="text"
              placeholder="Nome do aluno"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
              className={inputClass}
            />
            <input
              type="email"
              placeholder="E-mail do aluno"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              required
              className={inputClass}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-accent py-3 rounded-lg font-body font-semibold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Gerar link de convite"}
            </button>
          </form>
        ) : (
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Convite criado para <span className="text-foreground font-medium">{studentName}</span>. Compartilhe o link abaixo:
            </p>
            <div className="bg-secondary border border-border rounded-lg p-3 text-xs text-muted-foreground break-all select-all">
              {inviteLink}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border bg-secondary text-sm font-semibold hover:border-primary/40 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copiado!" : "Copiar link"}
              </button>
              <button
                onClick={handleSendEmail}
                disabled={emailSent}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg gradient-accent text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                {emailSent ? "Enviado" : "Enviar e-mail"}
              </button>
            </div>
            <button
              onClick={handleClose}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors pt-2"
            >
              Fechar
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentModal;
