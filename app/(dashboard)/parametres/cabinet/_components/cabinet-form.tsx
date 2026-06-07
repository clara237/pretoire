"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  Phone,
  Palette,
  ReceiptText,
  Upload,
  Trash2,
  Save,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { CabinetConfig } from "@/lib/cabinet";
import {
  enregistrerCabinet,
  televerserLogo,
  retirerLogo,
} from "@/lib/actions/parametres";

const DEVISES = [
  { value: "FCFA", label: "FCFA (Franc CFA)" },
  { value: "EUR", label: "EUR (Euro)" },
  { value: "USD", label: "USD (Dollar US)" },
];

const FORMATS_DATE = [
  { value: "JJ/MM/AAAA", label: "JJ/MM/AAAA (31/12/2026)" },
  { value: "AAAA-MM-JJ", label: "AAAA-MM-JJ (2026-12-31)" },
  { value: "MM/JJ/AAAA", label: "MM/JJ/AAAA (12/31/2026)" },
];

export function CabinetForm({ cabinet }: { cabinet: CabinetConfig }) {
  const router = useRouter();
  const inputLogoRef = React.useRef<HTMLInputElement>(null);

  const [enregistrement, setEnregistrement] = React.useState(false);
  const [uploadLogo, setUploadLogo] = React.useState(false);
  const [retraitOuvert, setRetraitOuvert] = React.useState(false);
  const [retraitEnCours, setRetraitEnCours] = React.useState(false);

  // État local pour l'aperçu immédiat
  const [nomCabinet, setNomCabinet] = React.useState(cabinet.nom_cabinet ?? "");
  const [couleurPrincipale, setCouleurPrincipale] = React.useState(
    cabinet.couleur_principale ?? "#007A5E",
  );
  const [couleurSecondaire, setCouleurSecondaire] = React.useState(
    cabinet.couleur_secondaire ?? "#CE1126",
  );
  const [tvaApplicable, setTvaApplicable] = React.useState(
    cabinet.tva_applicable ?? false,
  );
  const [logoUrl, setLogoUrl] = React.useState<string | null>(cabinet.logo_url);

  // Aperçu temps réel des couleurs via CSS vars (comme le CabinetProvider).
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--couleur-principale", couleurPrincipale);
  }, [couleurPrincipale]);
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--couleur-secondaire", couleurSecondaire);
  }, [couleurSecondaire]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnregistrement(true);
    const data = new FormData(e.currentTarget);
    const res = await enregistrerCabinet(data);
    setEnregistrement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Enregistrement impossible.");
      return;
    }
    toast.success("Paramètres du cabinet enregistrés.");
    router.refresh();
  }

  async function onChoisirLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    const data = new FormData();
    data.set("logo", fichier);
    setUploadLogo(true);
    const res = await televerserLogo(data);
    setUploadLogo(false);
    if (inputLogoRef.current) inputLogoRef.current.value = "";
    if (!res.ok) {
      toast.error(res.message ?? "Téléversement impossible.");
      return;
    }
    setLogoUrl(res.logoUrl ?? null);
    toast.success("Logo mis à jour.");
    router.refresh();
  }

  async function confirmerRetraitLogo() {
    setRetraitEnCours(true);
    const res = await retirerLogo();
    setRetraitEnCours(false);
    setRetraitOuvert(false);
    if (!res.ok) {
      toast.error(res.message ?? "Action impossible.");
      return;
    }
    setLogoUrl(null);
    toast.success("Logo retiré (logo par défaut rétabli).");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Colonne formulaire */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="identite">
            <TabsList>
              <TabsTrigger value="identite">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" /> Identité
                </span>
              </TabsTrigger>
              <TabsTrigger value="coordonnees">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-4 w-4" /> Coordonnées
                </span>
              </TabsTrigger>
              <TabsTrigger value="apparence">
                <span className="inline-flex items-center gap-1.5">
                  <Palette className="h-4 w-4" /> Apparence
                </span>
              </TabsTrigger>
              <TabsTrigger value="facturation">
                <span className="inline-flex items-center gap-1.5">
                  <ReceiptText className="h-4 w-4" /> Facturation
                </span>
              </TabsTrigger>
            </TabsList>

            {/* ----- IDENTITÉ ----- */}
            <TabsContent value="identite">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <Field label="Nom du cabinet" htmlFor="nom_cabinet" requis>
                    <Input
                      id="nom_cabinet"
                      name="nom_cabinet"
                      value={nomCabinet}
                      onChange={(e) => setNomCabinet(e.target.value)}
                      placeholder="Cabinet Maître …"
                      required
                    />
                  </Field>
                  <Field
                    label="Avocat principal"
                    htmlFor="nom_avocat_principal"
                  >
                    <Input
                      id="nom_avocat_principal"
                      name="nom_avocat_principal"
                      defaultValue={cabinet.nom_avocat_principal ?? ""}
                      placeholder="Maître …"
                    />
                  </Field>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Barreau" htmlFor="barreau">
                      <Input
                        id="barreau"
                        name="barreau"
                        defaultValue={cabinet.barreau ?? ""}
                        placeholder="Barreau du Cameroun"
                      />
                    </Field>
                    <Field
                      label="N° d'inscription au Barreau"
                      htmlFor="numero_barreau"
                    >
                      <Input
                        id="numero_barreau"
                        name="numero_barreau"
                        defaultValue={cabinet.numero_barreau ?? ""}
                        placeholder="CM-2008-0142"
                      />
                    </Field>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ----- COORDONNÉES ----- */}
            <TabsContent value="coordonnees">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <Field label="Adresse" htmlFor="adresse">
                    <Input
                      id="adresse"
                      name="adresse"
                      defaultValue={cabinet.adresse ?? ""}
                      placeholder="Quartier, rue…"
                    />
                  </Field>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Ville" htmlFor="ville">
                      <Input
                        id="ville"
                        name="ville"
                        defaultValue={cabinet.ville ?? ""}
                        placeholder="Yaoundé"
                      />
                    </Field>
                    <Field label="Pays" htmlFor="pays">
                      <Input
                        id="pays"
                        name="pays"
                        defaultValue={cabinet.pays ?? "Cameroun"}
                        placeholder="Cameroun"
                      />
                    </Field>
                    <Field label="Téléphone 1" htmlFor="telephone_1">
                      <Input
                        id="telephone_1"
                        name="telephone_1"
                        defaultValue={cabinet.telephone_1 ?? ""}
                        placeholder="+237 6XX XXX XXX"
                      />
                    </Field>
                    <Field label="Téléphone 2" htmlFor="telephone_2">
                      <Input
                        id="telephone_2"
                        name="telephone_2"
                        defaultValue={cabinet.telephone_2 ?? ""}
                        placeholder="+237 6XX XXX XXX"
                      />
                    </Field>
                    <Field label="Email" htmlFor="email">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={cabinet.email ?? ""}
                        placeholder="contact@cabinet.cm"
                      />
                    </Field>
                    <Field label="Site web" htmlFor="site_web">
                      <Input
                        id="site_web"
                        name="site_web"
                        defaultValue={cabinet.site_web ?? ""}
                        placeholder="https://www.cabinet.cm"
                      />
                    </Field>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ----- APPARENCE ----- */}
            <TabsContent value="apparence">
              <Card>
                <CardContent className="space-y-6 pt-6">
                  {/* Logo */}
                  <div>
                    <p className="mb-2 block text-sm font-medium text-foreground">
                      Logo du cabinet
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={logoUrl}
                            alt="Logo du cabinet"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Scale className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variante="contour"
                            taille="sm"
                            iconeGauche={<Upload className="h-4 w-4" />}
                            enChargement={uploadLogo}
                            onClick={() => inputLogoRef.current?.click()}
                          >
                            {logoUrl ? "Remplacer" : "Téléverser un logo"}
                          </Button>
                          {logoUrl && (
                            <Button
                              type="button"
                              variante="contour"
                              taille="sm"
                              iconeGauche={<Trash2 className="h-4 w-4" />}
                              onClick={() => setRetraitOuvert(true)}
                            >
                              Retirer
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG ou SVG. 5 Mo maximum. Remplace le logo par
                          défaut dans la barre latérale, la connexion et les PDF.
                        </p>
                      </div>
                      <input
                        ref={inputLogoRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onChoisirLogo}
                      />
                    </div>
                  </div>

                  {/* Couleurs */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ChampCouleur
                      label="Couleur principale"
                      name="couleur_principale"
                      valeur={couleurPrincipale}
                      onChange={setCouleurPrincipale}
                    />
                    <ChampCouleur
                      label="Couleur secondaire"
                      name="couleur_secondaire"
                      valeur={couleurSecondaire}
                      onChange={setCouleurSecondaire}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Devise" htmlFor="devise">
                      <Select
                        id="devise"
                        name="devise"
                        defaultValue={cabinet.devise ?? "FCFA"}
                        options={DEVISES}
                      />
                    </Field>
                    <Field label="Format de date" htmlFor="format_date">
                      <Select
                        id="format_date"
                        name="format_date"
                        defaultValue={cabinet.format_date ?? "JJ/MM/AAAA"}
                        options={FORMATS_DATE}
                      />
                    </Field>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ----- FACTURATION ----- */}
            <TabsContent value="facturation">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <label className="flex items-center gap-3 rounded-lg border border-border p-4">
                    <input
                      type="checkbox"
                      name="tva_applicable"
                      checked={tvaApplicable}
                      onChange={(e) => setTvaApplicable(e.target.checked)}
                      className="h-4 w-4 rounded border-input accent-[var(--couleur-principale)]"
                    />
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        TVA applicable
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Active le calcul de la TVA sur les factures.
                      </span>
                    </span>
                  </label>

                  <Field
                    label="Taux de TVA (%)"
                    htmlFor="taux_tva"
                    aide="Appliqué uniquement si la TVA est activée."
                  >
                    <Input
                      id="taux_tva"
                      name="taux_tva"
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      defaultValue={cabinet.taux_tva ?? 0}
                      disabled={!tvaApplicable}
                      placeholder="19.25"
                    />
                  </Field>

                  <Field
                    label="Pied de page des factures"
                    htmlFor="pied_de_page_facture"
                    aide="Mentions légales, conditions de règlement, RIB…"
                  >
                    <Textarea
                      id="pied_de_page_facture"
                      name="pied_de_page_facture"
                      rows={4}
                      defaultValue={cabinet.pied_de_page_facture ?? ""}
                      placeholder="Règlement à 30 jours. Tout retard entraîne des pénalités…"
                    />
                  </Field>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex items-center gap-2">
            <Button
              type="submit"
              enChargement={enregistrement}
              iconeGauche={<Save className="h-4 w-4" />}
            >
              Enregistrer les modifications
            </Button>
          </div>
        </div>

        {/* Colonne aperçu */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-base">Aperçu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Aperçu en-tête / sidebar */}
              <div className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-DEFAULT"
                    style={{ backgroundColor: `${couleurPrincipale}1a` }}
                  >
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoUrl}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Scale
                        className="h-5 w-5"
                        style={{ color: couleurPrincipale }}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">
                      {nomCabinet || "Nom du cabinet"}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Prétoire
                    </p>
                  </div>
                </div>
              </div>

              {/* Aperçu boutons / couleurs */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Couleurs du thème
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1 text-center">
                    <div
                      className="h-10 rounded-DEFAULT"
                      style={{ backgroundColor: couleurPrincipale }}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Principale
                    </p>
                  </div>
                  <div className="flex-1 space-y-1 text-center">
                    <div
                      className="h-10 rounded-DEFAULT"
                      style={{ backgroundColor: couleurSecondaire }}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Secondaire
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-full rounded-DEFAULT px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: couleurPrincipale }}
                  tabIndex={-1}
                >
                  Bouton principal
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Les modifications de couleur sont visibles en direct dans toute
                l&apos;interface. Cliquez sur « Enregistrer » pour les conserver.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        ouvert={retraitOuvert}
        onClose={() => setRetraitOuvert(false)}
        onConfirm={confirmerRetraitLogo}
        enChargement={retraitEnCours}
        titre="Retirer le logo"
        message="Le logo par défaut sera rétabli dans toute l'application."
        texteConfirmer="Retirer"
      />
    </form>
  );
}

/** Sélecteur de couleur natif + saisie hexadécimale synchronisée. */
function ChampCouleur({
  label,
  name,
  valeur,
  onChange,
}: {
  label: string;
  name: string;
  valeur: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label} htmlFor={name}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-10 w-12 shrink-0 cursor-pointer rounded-DEFAULT border border-input bg-card p-1",
          )}
          aria-label={label}
        />
        <Input
          id={name}
          name={name}
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#007A5E"
          className="font-mono"
        />
      </div>
    </Field>
  );
}
