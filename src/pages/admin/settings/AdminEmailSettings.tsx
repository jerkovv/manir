import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Send, Save, FlaskConical, Lock, AlertTriangle, ShieldAlert } from "lucide-react";
import {
  PREMIUM_CUSTOMER_TEMPLATE,
  PREMIUM_ADMIN_TEMPLATE,
  PREMIUM_CUSTOMER_SUBJECT,
  PREMIUM_ADMIN_SUBJECT,
} from "@/lib/premiumEmailTemplates";

type Settings = {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string; // samo input, ne učitava se
  smtp_secure: boolean;
  from_name: string;
  from_email: string;
  admin_email: string;
  reply_to: string;
  customer_subject: string;
  customer_template: string;
  admin_subject: string;
  admin_template: string;
  enabled: boolean;
};

type LogRow = {
  id: string;
  order_id: string | null;
  recipient: string;
  type: "customer" | "admin" | "test";
  status: "sent" | "failed";
  error_message: string | null;
  sent_at: string;
};

const DEFAULT: Settings = {
  smtp_host: "mailcluster.loopia.se",
  smtp_port: 465,
  smtp_user: "",
  smtp_password: "",
  smtp_secure: true,
  from_name: "0202skin",
  from_email: "",
  admin_email: "",
  reply_to: "",
  customer_subject: "Potvrda porudžbine #{orderId}",
  customer_template: "",
  admin_subject: "Nova porudžbina #{orderId} — {customerName}",
  admin_template: "",
  enabled: false,
};

const PLACEHOLDERS_CUSTOMER = [
  "customerName",
  "customerEmail",
  "customerPhone",
  "orderId",
  "orderDate",
  "itemsTable",
  "subtotal",
  "discountAmount",
  "discountLabel",
  "total",
  "shippingAddress",
  "shippingCity",
  "shippingZip",
  "note",
];
const PLACEHOLDERS_ADMIN = [
  "customerName",
  "customerEmail",
  "customerPhone",
  "orderId",
  "orderDate",
  "itemsTable",
  "subtotal",
  "discountAmount",
  "discountLabel",
  "total",
  "shippingAddress",
  "shippingCity",
  "shippingZip",
  "note",
];

const DEMO = {
  customerName: "Petar Petrović",
  customerEmail: "petar@primer.rs",
  orderId: "1234",
  total: "8.500",
  orderDate: "27.04.2026.",
  customerPhone: "+381 60 123 4567",
  shippingAddress: "Knez Mihailova 12",
  shippingCity: "Beograd",
  shippingZip: "11000",
  note: "Molim vas zvonite na interfon, stan 4.",
  subtotal: "9.000",
  discountAmount: "500",
  discountLabel: "WELCOME10",
  itemsTable: `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #eee;font-size:14px;">
    <thead><tr style="background:#F5F0E8;"><th style="padding:10px;text-align:left;">Proizvod</th><th style="padding:10px;">Kol.</th><th style="padding:10px;text-align:right;">Cena</th></tr></thead>
    <tbody>
      <tr><td style="padding:10px;border-top:1px solid #eee;">Hidratantni serum</td><td style="padding:10px;text-align:center;border-top:1px solid #eee;">1</td><td style="padding:10px;text-align:right;border-top:1px solid #eee;">4.500 RSD</td></tr>
      <tr><td style="padding:10px;border-top:1px solid #eee;">Ulje za lice</td><td style="padding:10px;text-align:center;border-top:1px solid #eee;">2</td><td style="padding:10px;text-align:right;border-top:1px solid #eee;">4.000 RSD</td></tr>
    </tbody>
  </table>`,
};

function applyDemo(tpl: string): string {
  let out = tpl;
  for (const [k, v] of Object.entries(DEMO)) {
    out = out.split(`{${k}}`).join(v);
  }
  return out;
}

const AdminEmailSettings = () => {
  const [s, setS] = useState<Settings>(DEFAULT);
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [testOpen, setTestOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [testing, setTesting] = useState(false);

  const [previewOpen, setPreviewOpen] = useState<null | "customer" | "admin">(null);

  const [logs, setLogs] = useState<LogRow[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [errorRow, setErrorRow] = useState<LogRow | null>(null);

  // SMTP zaključavanje
  const [smtpUnlocked, setSmtpUnlocked] = useState(false);
  const [warnOpen, setWarnOpen] = useState(false);
  const [countdown, setCountdown] = useState(15);

  // Odbrojavanje kad je dialog otvoren
  useEffect(() => {
    if (!warnOpen) return;
    setCountdown(15);
    const t = setInterval(() => {
      setCountdown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [warnOpen]);
  const PAGE_SIZE = 25;

  // Učitaj
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("email_settings_safe")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) {
        toast.error("Greška pri učitavanju: " + error.message);
      } else if (data) {
        setS({
          smtp_host: data.smtp_host || DEFAULT.smtp_host,
          smtp_port: data.smtp_port ?? 465,
          smtp_user: data.smtp_user || "",
          smtp_password: "",
          smtp_secure: !!data.smtp_secure,
          from_name: data.from_name || "0202skin",
          from_email: data.from_email || "",
          admin_email: data.admin_email || "",
          reply_to: data.reply_to || "",
          customer_subject: data.customer_subject || DEFAULT.customer_subject,
          customer_template: data.customer_template || "",
          admin_subject: data.admin_subject || DEFAULT.admin_subject,
          admin_template: data.admin_template || "",
          enabled: !!data.enabled,
        });
        setHasPassword(!!data.has_password);
      }
      setLoading(false);
    })();
  }, []);

  const loadLogs = async (p = 0) => {
    setLogsLoading(true);
    const from = p * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("email_logs")
      .select("*")
      .order("sent_at", { ascending: false })
      .range(from, to);
    if (error) toast.error(error.message);
    else setLogs((data as LogRow[]) || []);
    setLogsLoading(false);
  };

  useEffect(() => { loadLogs(page); }, [page]);

  const save = async () => {
    if (!s.smtp_host || !s.smtp_user || !s.from_email) {
      return toast.error("Host, SMTP user i From email su obavezni");
    }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("save-email-settings", {
      body: {
        smtp_host: s.smtp_host,
        smtp_port: Number(s.smtp_port),
        smtp_user: s.smtp_user,
        smtp_password: s.smtp_password || "",
        smtp_secure: s.smtp_secure,
        from_name: s.from_name,
        from_email: s.from_email,
        admin_email: s.admin_email,
        reply_to: s.reply_to || null,
        customer_subject: s.customer_subject,
        customer_template: s.customer_template,
        admin_subject: s.admin_subject,
        admin_template: s.admin_template,
        enabled: s.enabled,
      },
    });
    setSaving(false);
    if (error) return toast.error("Greška: " + error.message);
    if (data && (data as any).success === false) {
      return toast.error("Greška: " + (data as any).error);
    }
    toast.success("Podešavanja sačuvana");
    if (s.smtp_password) setHasPassword(true);
    setS({ ...s, smtp_password: "" });
  };

  const runTest = async () => {
    if (!testRecipient) return toast.error("Unesite email primaoca");
    if (!s.smtp_password && !hasPassword) {
      return toast.error("Unesite SMTP lozinku u formu pre testa");
    }
    if (!s.smtp_password && hasPassword) {
      return toast.error("Za test morate ponovo uneti lozinku (čuva se enkriptovano)");
    }
    setTesting(true);
    const { data, error } = await supabase.functions.invoke("test-email-smtp", {
      body: {
        smtp_host: s.smtp_host,
        smtp_port: Number(s.smtp_port),
        smtp_user: s.smtp_user,
        smtp_password: s.smtp_password,
        smtp_secure: s.smtp_secure,
        from_name: s.from_name,
        from_email: s.from_email,
        test_recipient: testRecipient,
      },
    });
    setTesting(false);
    if (error) return toast.error("Greška: " + error.message);
    if (data?.success) {
      toast.success(data.message || "Test email poslat");
      setTestOpen(false);
    } else {
      toast.error("SMTP greška: " + (data?.error || "nepoznato"));
    }
  };

  const insertPlaceholder = (field: "customer_template" | "admin_template", ph: string) => {
    setS((prev) => ({ ...prev, [field]: prev[field] + `{${ph}}` }));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="font-heading text-3xl mb-1">Email podešavanja</h1>
        <p className="font-body text-sm text-muted-foreground">SMTP server, šabloni i log obaveštenja o porudžbinama.</p>
      </div>

      <Tabs defaultValue="smtp" className="w-full">
        <TabsList className="mb-6 flex-wrap h-auto">
          <TabsTrigger value="smtp">SMTP konekcija</TabsTrigger>
          <TabsTrigger value="customer">Šablon — kupac</TabsTrigger>
          <TabsTrigger value="admin">Šablon — admin</TabsTrigger>
          <TabsTrigger value="logs">Log poslatih</TabsTrigger>
        </TabsList>

        {/* ============ TAB 1: SMTP ============ */}
        <TabsContent value="smtp" className="space-y-6">
          {!smtpUnlocked && (
            <div className="bg-red-50 border-2 border-red-300 rounded-md p-5 flex items-start gap-4">
              <Lock className="text-red-600 shrink-0 mt-0.5" size={28} />
              <div className="flex-1">
                <div className="font-heading text-lg text-red-900 mb-1">SMTP konekcija je zaključana</div>
                <p className="font-body text-sm text-red-800/90 mb-3">
                  Ova podešavanja kontrolišu slanje SVIH email-ova sa sajta (porudžbine, obaveštenja).
                  Pogrešna izmena može potpuno onemogućiti slanje. Ne menjaj ništa osim ako tačno znaš šta radiš.
                </p>
                <button
                  onClick={() => setWarnOpen(true)}
                  className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 font-body text-xs tracking-[0.15em] uppercase hover:bg-red-700 transition-colors"
                >
                  <ShieldAlert size={14} /> Otključaj izmene
                </button>
              </div>
            </div>
          )}
          {smtpUnlocked && (
            <div className="bg-amber-50 border border-amber-300 rounded-md px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-amber-900">
                <AlertTriangle size={16} className="text-amber-600" />
                <span className="font-body">SMTP polja su otključana. Budi pažljiv — ne čuvaj izmene osim ako si siguran.</span>
              </div>
              <button
                onClick={() => setSmtpUnlocked(false)}
                className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-amber-900 hover:text-amber-950 border border-amber-400 px-3 py-1.5"
              >
                <Lock size={12} /> Zaključaj nazad
              </button>
            </div>
          )}
          <fieldset disabled={!smtpUnlocked} className={!smtpUnlocked ? "opacity-60 pointer-events-none select-none" : ""}>
          <div className="bg-white border border-border rounded-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-body text-sm">Email obaveštenja uključena</Label>
                <p className="font-body text-xs text-muted-foreground mt-1">Kada je isključeno, email se ne šalje posle porudžbine.</p>
              </div>
              <Switch checked={s.enabled} onCheckedChange={(v) => setS({ ...s, enabled: v })} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">SMTP host</Label>
                <Input value={s.smtp_host} onChange={(e) => setS({ ...s, smtp_host: e.target.value })} placeholder="mailcluster.loopia.se" />
                <p className="text-[11px] text-muted-foreground mt-1">Za Loopia obično je <code>mailcluster.loopia.se</code> ili <code>smtp.loopia.rs</code> — proveri u Loopia control panelu pod Email → Pristup.</p>
              </div>
              <div>
                <Label className="text-xs">SMTP port</Label>
                <Input type="number" value={s.smtp_port} onChange={(e) => setS({ ...s, smtp_port: Number(e.target.value) })} placeholder="465" />
                <p className="text-[11px] text-muted-foreground mt-1">465 za SSL/TLS (preporučeno) ili 587 za STARTTLS.</p>
              </div>
              <div>
                <Label className="text-xs">SMTP user (full email)</Label>
                <Input value={s.smtp_user} onChange={(e) => setS({ ...s, smtp_user: e.target.value })} placeholder="info@0202skin.com" />
              </div>
              <div>
                <Label className="text-xs flex items-center justify-between">
                  <span>SMTP lozinka {hasPassword && <Badge variant="secondary" className="ml-2 text-[10px]">sačuvana</Badge>}</span>
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-muted-foreground hover:text-foreground">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </Label>
                <Input
                  type={showPwd ? "text" : "password"}
                  value={s.smtp_password}
                  onChange={(e) => setS({ ...s, smtp_password: e.target.value })}
                  placeholder={hasPassword ? "•••••••• (ostavi prazno da ne menjaš)" : "Lozinka"}
                />
              </div>
              <div className="flex items-center gap-3 sm:col-span-2 pt-1">
                <Switch checked={s.smtp_secure} onCheckedChange={(v) => setS({ ...s, smtp_secure: v })} />
                <Label className="text-xs">SSL/TLS direktno (uključeno za port 465, isključeno za 587)</Label>
              </div>
            </div>

            <div className="border-t pt-5 grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">From name</Label>
                <Input value={s.from_name} onChange={(e) => setS({ ...s, from_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">From email</Label>
                <Input value={s.from_email} onChange={(e) => setS({ ...s, from_email: e.target.value })} placeholder="info@0202skin.com" />
              </div>
              <div>
                <Label className="text-xs">Admin email (prima obaveštenja)</Label>
                <Input value={s.admin_email} onChange={(e) => setS({ ...s, admin_email: e.target.value })} placeholder="porudzbine@0202skin.com" />
              </div>
              <div>
                <Label className="text-xs">Reply-To (opciono)</Label>
                <Input value={s.reply_to} onChange={(e) => setS({ ...s, reply_to: e.target.value })} />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2 border-t">
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-warm-brown text-primary-foreground px-5 py-2.5 font-body text-xs tracking-[0.15em] uppercase hover:bg-warm-dark transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Sačuvaj
              </button>
              <button
                onClick={() => setTestOpen(true)}
                className="inline-flex items-center gap-2 border border-border px-5 py-2.5 font-body text-xs tracking-[0.15em] uppercase hover:bg-[#F5F0E8] transition-colors"
              >
                <FlaskConical size={14} /> Testiraj konekciju
              </button>
            </div>
          </div>
          </fieldset>
        </TabsContent>

        {/* ============ TAB 2: Customer template ============ */}
        <TabsContent value="customer">
          <TemplateEditor
            subject={s.customer_subject}
            template={s.customer_template}
            placeholders={PLACEHOLDERS_CUSTOMER}
            onSubjectChange={(v) => setS({ ...s, customer_subject: v })}
            onTemplateChange={(v) => setS({ ...s, customer_template: v })}
            onInsert={(ph) => insertPlaceholder("customer_template", ph)}
            onPreview={() => setPreviewOpen("customer")}
            onSave={save}
            saving={saving}
            onLoadPremium={() => setS({
              ...s,
              customer_subject: PREMIUM_CUSTOMER_SUBJECT,
              customer_template: PREMIUM_CUSTOMER_TEMPLATE,
            })}
          />
        </TabsContent>

        {/* ============ TAB 3: Admin template ============ */}
        <TabsContent value="admin">
          <TemplateEditor
            subject={s.admin_subject}
            template={s.admin_template}
            placeholders={PLACEHOLDERS_ADMIN}
            onSubjectChange={(v) => setS({ ...s, admin_subject: v })}
            onTemplateChange={(v) => setS({ ...s, admin_template: v })}
            onInsert={(ph) => insertPlaceholder("admin_template", ph)}
            onPreview={() => setPreviewOpen("admin")}
            onSave={save}
            saving={saving}
            onLoadPremium={() => setS({
              ...s,
              admin_subject: PREMIUM_ADMIN_SUBJECT,
              admin_template: PREMIUM_ADMIN_TEMPLATE,
            })}
          />
        </TabsContent>

        {/* ============ TAB 4: Logs ============ */}
        <TabsContent value="logs">
          <div className="bg-white border border-border rounded-md overflow-hidden">
            {logsLoading ? (
              <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>
            ) : logs.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">Nema poslatih email-ova.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F5F0E8] text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">Vreme</th>
                      <th className="text-left p-3">Tip</th>
                      <th className="text-left p-3">Primalac</th>
                      <th className="text-left p-3">Order</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr
                        key={l.id}
                        className={`border-t border-border ${l.status === "failed" ? "cursor-pointer hover:bg-red-50" : ""}`}
                        onClick={() => l.status === "failed" && setErrorRow(l)}
                      >
                        <td className="p-3 whitespace-nowrap">{new Date(l.sent_at).toLocaleString("sr-RS")}</td>
                        <td className="p-3">{l.type === "customer" ? "Kupac" : l.type === "admin" ? "Admin" : "Test"}</td>
                        <td className="p-3">{l.recipient}</td>
                        <td className="p-3 text-xs text-muted-foreground">{l.order_id ? l.order_id.slice(0, 8) : "—"}</td>
                        <td className="p-3">
                          {l.status === "sent"
                            ? <Badge className="bg-green-600 hover:bg-green-700">poslato</Badge>
                            : <Badge variant="destructive">greška</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-between items-center p-3 border-t border-border text-xs">
              <span className="text-muted-foreground">Strana {page + 1}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1 border rounded disabled:opacity-40">‹ Prethodna</button>
                <button onClick={() => setPage(page + 1)} disabled={logs.length < PAGE_SIZE} className="px-3 py-1 border rounded disabled:opacity-40">Sledeća ›</button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ===== SMTP unlock warning dialog ===== */}
      <Dialog open={warnOpen} onOpenChange={setWarnOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="text-red-600" size={22} />
              UPOZORENJE — kritična podešavanja
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 space-y-2">
              <p className="font-body text-sm text-red-900 font-semibold">
                Ova podešavanja drže ceo email sistem na životu.
              </p>
              <p className="font-body text-sm text-red-900/90">
                Ako promeniš host, port, korisnika ili lozinku — porudžbine NEĆE STIZATI ni kupcima
                ni adminu. Test email-ovi će padati. Sajt će izgledati kao da radi, ali nijedan
                email neće biti poslat.
              </p>
            </div>
            <ul className="text-sm text-foreground/80 space-y-1.5 list-disc pl-5">
              <li>Ne menjaj ništa osim ako ti je SMTP server JAVIO da nešto treba da se menja.</li>
              <li>Pre čuvanja, OBAVEZNO klikni „Testiraj konekciju" — ako test ne prođe, ne čuvaj.</li>
              <li>Lozinku unosi samo ako je hosting promenio kredencijale.</li>
              <li>Ako nisi siguran — zatvori ovaj prozor i ne diraj ništa.</li>
            </ul>
            <div className="bg-amber-50 border border-amber-300 rounded p-3 text-xs text-amber-900 font-body">
              Sačekaj odbrojavanje ({countdown}s) pre nego što možeš da potvrdiš.
              Ovo je namerno — da imaš vreme da se predomisliš.
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setWarnOpen(false)}
              className="px-4 py-2 text-xs uppercase tracking-wider border border-border hover:bg-muted"
            >
              Otkaži (preporučeno)
            </button>
            <button
              onClick={() => { setSmtpUnlocked(true); setWarnOpen(false); }}
              disabled={countdown > 0}
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 text-xs uppercase tracking-wider hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {countdown > 0 ? `Sačekaj ${countdown}s` : "Razumem rizik, otključaj"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Test dialog ===== */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Testiraj SMTP konekciju</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-xs">Email primaoca testa</Label>
            <Input value={testRecipient} onChange={(e) => setTestRecipient(e.target.value)} placeholder="ti@primer.com" />
            <p className="text-[11px] text-muted-foreground">
              Šalje testni email koristeći podatke trenutno upisane u formu (i lozinku iz polja).
              Ako je lozinka već sačuvana, ali polje prazno — moraš je ponovo uneti za test.
            </p>
          </div>
          <DialogFooter>
            <button onClick={() => setTestOpen(false)} className="px-4 py-2 text-xs uppercase tracking-wider border border-border">Otkaži</button>
            <button onClick={runTest} disabled={testing} className="inline-flex items-center gap-2 bg-warm-brown text-primary-foreground px-4 py-2 text-xs uppercase tracking-wider disabled:opacity-60">
              {testing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Pošalji test
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Preview dialog ===== */}
      <Dialog open={previewOpen !== null} onOpenChange={(o) => !o && setPreviewOpen(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pregled — {previewOpen === "admin" ? "Admin" : "Kupac"}</DialogTitle>
          </DialogHeader>
          <div className="text-xs text-muted-foreground mb-2">
            Subject: <strong className="text-foreground">{applyDemo(previewOpen === "admin" ? s.admin_subject : s.customer_subject)}</strong>
          </div>
          <div className="border rounded overflow-hidden bg-white">
            <iframe
              title="preview"
              className="w-full h-[60vh]"
              srcDoc={applyDemo(previewOpen === "admin" ? s.admin_template : s.customer_template)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Error row dialog ===== */}
      <Dialog open={!!errorRow} onOpenChange={(o) => !o && setErrorRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalji greške</DialogTitle>
          </DialogHeader>
          <div className="text-sm space-y-2">
            <div><span className="text-muted-foreground">Primalac:</span> {errorRow?.recipient}</div>
            <div><span className="text-muted-foreground">Vreme:</span> {errorRow && new Date(errorRow.sent_at).toLocaleString("sr-RS")}</div>
            <div className="bg-red-50 border border-red-200 rounded p-3 font-mono text-xs whitespace-pre-wrap break-all">
              {errorRow?.error_message || "(prazno)"}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ---------- Sub-component: Template editor ----------

const TemplateEditor = ({
  subject, template, placeholders,
  onSubjectChange, onTemplateChange, onInsert, onPreview, onSave, saving, onLoadPremium,
}: {
  subject: string;
  template: string;
  placeholders: string[];
  onSubjectChange: (v: string) => void;
  onTemplateChange: (v: string) => void;
  onInsert: (ph: string) => void;
  onPreview: () => void;
  onSave: () => void;
  saving: boolean;
  onLoadPremium: () => void;
}) => (
  <div className="grid lg:grid-cols-[1fr_220px] gap-6">
    <div className="bg-white border border-border rounded-md p-6 space-y-4">
      <div>
        <Label className="text-xs">Subject</Label>
        <Input value={subject} onChange={(e) => onSubjectChange(e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">HTML šablon</Label>
        <Textarea
          value={template}
          onChange={(e) => onTemplateChange(e.target.value)}
          className="font-mono text-xs min-h-[400px]"
        />
      </div>
      <div className="flex flex-wrap gap-3 pt-2 border-t">
        <button onClick={onSave} disabled={saving} className="inline-flex items-center gap-2 bg-warm-brown text-primary-foreground px-5 py-2.5 text-xs uppercase tracking-[0.15em] hover:bg-warm-dark disabled:opacity-60">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Sačuvaj
        </button>
        <button onClick={onPreview} className="inline-flex items-center gap-2 border border-border px-5 py-2.5 text-xs uppercase tracking-[0.15em] hover:bg-[#F5F0E8]">
          <Eye size={14} /> Pregled
        </button>
        <button
          onClick={() => {
            if (template && !confirm("Ovo će zameniti trenutni HTML šablon premium dizajnom. Nastaviti?")) return;
            onLoadPremium();
          }}
          className="inline-flex items-center gap-2 border border-warm-brown text-warm-brown px-5 py-2.5 text-xs uppercase tracking-[0.15em] hover:bg-warm-brown hover:text-primary-foreground transition-colors"
        >
          ✦ Učitaj premium dizajn
        </button>
      </div>
    </div>
    <div className="bg-white border border-border rounded-md p-4 h-fit">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Placeholder-i</Label>
      <p className="text-[11px] text-muted-foreground mt-1 mb-3">Klikni za umetanje na kraj.</p>
      <div className="flex flex-wrap gap-2">
        {placeholders.map((p) => (
          <button
            key={p}
            onClick={() => onInsert(p)}
            className="text-xs font-mono bg-[#F5F0E8] hover:bg-warm-brown hover:text-primary-foreground px-2 py-1 rounded transition-colors"
          >
            {`{${p}}`}
          </button>
        ))}
      </div>
      <div className="mt-5 pt-4 border-t border-border">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Uslovni blokovi</Label>
        <p className="text-[11px] text-muted-foreground mt-1 mb-2">
          Sakrij deo HTML-a kad polje nema vrednost. Primer:
        </p>
        <pre className="text-[11px] font-mono bg-[#F5F0E8] p-2 rounded whitespace-pre-wrap leading-relaxed">{`{#if discountAmount}
  <tr>
    <td>{discountLabel}</td>
    <td>-{discountAmount}</td>
  </tr>
{/if}`}</pre>
        <p className="text-[10px] text-muted-foreground mt-2">
          Radi za sva polja: <code>note</code>, <code>discountAmount</code>, <code>customerPhone</code> itd.
        </p>
      </div>
    </div>
  </div>
);

export default AdminEmailSettings;
