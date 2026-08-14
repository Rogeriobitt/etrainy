import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldCheck } from "lucide-react";
import logo from "@/assets/trainylab-logo.png";

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

const OAuthConsent = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Parâmetro authorization_id ausente.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error: detailsError } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (detailsError) {
        setError(detailsError.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    const { data, error: decisionError } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (decisionError) {
      setBusy(false);
      setError(decisionError.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("O servidor de autorização não retornou um redirecionamento.");
      return;
    }
    window.location.href = target;
  };

  const clientName = details?.client?.name ?? "o aplicativo";

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <img src={logo} alt="TrainyLab" className="h-14 w-auto mx-auto mb-8" />

        {error ? (
          <div className="bg-card border border-destructive/40 rounded-xl p-6">
            <h1 className="text-2xl font-heading tracking-wide mb-2">Não foi possível continuar</h1>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        ) : !details ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm">Carregando pedido de autorização…</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-6 text-left">
            <ShieldCheck className="w-8 h-8 text-primary mb-4" />
            <h1 className="text-2xl font-heading tracking-wide mb-2">
              Conectar {clientName} à sua conta
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              {clientName} poderá ler seus dados do TrainyLab (perfil, séries de treino, alunos e
              notificações) agindo como você. Você pode revogar o acesso a qualquer momento.
            </p>
            <div className="flex gap-3">
              <button
                disabled={busy}
                onClick={() => decide(true)}
                className="flex-1 gradient-accent py-3 rounded-lg font-semibold text-primary-foreground disabled:opacity-50"
              >
                {busy ? "Processando…" : "Aprovar"}
              </button>
              <button
                disabled={busy}
                onClick={() => decide(false)}
                className="flex-1 border border-border py-3 rounded-lg font-semibold text-foreground disabled:opacity-50"
              >
                Recusar
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default OAuthConsent;
