"use client";

import { useState } from "react";
import { Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";

import FormattedNumberInput from "@/shared/components/form/FormattedNumberInput";
import CurrencyInput from "@/shared/components/form/CurrencyInput";
import { Event, SouvenirRules, SouvenirTier } from "@/entities/event/event.entity";
import { updateSouvenirRules } from "@/services/souvenir.service";
import SouvenirCatalogEditor, { normalizeCatalog } from "./SouvenirCatalogEditor";

/** Quick editor (organizer) for the event's souvenir point rules & catalog. */
export default function SouvenirQuickSettings({
  event,
  onSaved,
}: {
  event: Event;
  onSaved?: (rules: SouvenirRules) => void;
}) {
  const initial = event.souvenir_rules ?? {};
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [boothOn, setBoothOn] = useState(initial.boothVisitPoint?.enabled ?? true);
  const [boothPts, setBoothPts] = useState(initial.boothVisitPoint?.pointsPerVisit ?? 10);
  const [semOn, setSemOn] = useState(initial.seminarPoint?.enabled ?? true);
  const [semPts, setSemPts] = useState(initial.seminarPoint?.pointsPerSeminar ?? 25);
  const [txOn, setTxOn] = useState(initial.transactionPoint?.enabled ?? false);
  const [txPts, setTxPts] = useState(initial.transactionPoint?.pointsPerTransaction ?? 0);
  const [txStep, setTxStep] = useState(initial.transactionPoint?.amountStep ?? 50000);
  const [txStepPts, setTxStepPts] = useState(initial.transactionPoint?.pointsPerAmountStep ?? 10);
  const [tiers, setTiers] = useState<SouvenirTier[]>(initial.tiers ?? []);

  const save = async () => {
    setSaving(true);
    try {
      // Point system + catalog is the only souvenir mode.
      const rules: SouvenirRules = {
        usePointSystem: true,
        boothVisitPoint: { enabled: boothOn, pointsPerVisit: boothPts },
        seminarPoint: { enabled: semOn, pointsPerSeminar: semPts },
        transactionPoint: {
          enabled: txOn,
          pointsPerTransaction: txPts,
          amountStep: txStep,
          pointsPerAmountStep: txStepPts,
        },
        tiers: normalizeCatalog(tiers),
      };
      const res = await updateSouvenirRules(event.uuid, rules);
      if (!res.status) throw new Error(res.message || "Gagal menyimpan pengaturan");
      toast.success("Pengaturan souvenir disimpan");
      onSaved?.(rules);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer"
      >
        <Settings2 className="h-4 w-4" /> Pengaturan Cepat Souvenir
        <span className="ml-auto text-xs font-medium text-gray-400">
          {tiers.length} item katalog
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4 text-xs">
          <div className="space-y-3">
            <label className="flex items-center gap-2 font-semibold cursor-pointer">
              <input type="checkbox" checked={boothOn} onChange={(e) => setBoothOn(e.target.checked)} />
              Kunjungan Booth
            </label>
            {boothOn && (
              <FormattedNumberInput
                label="Poin per Booth"
                value={boothPts}
                onChange={(v) => setBoothPts(Number(v))}
                suffix="Poin"
                placeholder="10"
              />
            )}

            <label className="flex items-center gap-2 font-semibold cursor-pointer">
              <input type="checkbox" checked={semOn} onChange={(e) => setSemOn(e.target.checked)} />
              Seminar / Workshop
            </label>
            {semOn && (
              <FormattedNumberInput
                label="Poin per Seminar"
                value={semPts}
                onChange={(v) => setSemPts(Number(v))}
                suffix="Poin"
                placeholder="25"
              />
            )}

            <label className="flex items-center gap-2 font-semibold cursor-pointer">
              <input type="checkbox" checked={txOn} onChange={(e) => setTxOn(e.target.checked)} />
              Transaksi Pembelian
            </label>
            {txOn && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormattedNumberInput
                  label="Poin per Transaksi"
                  value={txPts}
                  onChange={(v) => setTxPts(Number(v))}
                  suffix="Poin"
                  placeholder="0"
                />
                <CurrencyInput
                  label="Kelipatan Nominal"
                  value={txStep}
                  onChange={(v) => setTxStep(Number(v))}
                  placeholder="50000"
                  hint="0 = nonaktif"
                />
                <FormattedNumberInput
                  label="Poin per Kelipatan"
                  value={txStepPts}
                  onChange={(v) => setTxStepPts(Number(v))}
                  suffix="Poin"
                  placeholder="10"
                />
              </div>
            )}
          </div>

          <SouvenirCatalogEditor eventId={event.uuid} items={tiers} onChange={setTiers} />

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan Pengaturan
          </button>
        </div>
      )}
    </div>
  );
}

