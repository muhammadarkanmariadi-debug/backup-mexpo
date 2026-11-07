"use client";

import { useState } from "react";
import { Loader2, Settings2, X } from "lucide-react";
import { toast } from "sonner";

import Input from "@/shared/components/form/Input";
import FormattedNumberInput from "@/shared/components/form/FormattedNumberInput";
import CurrencyInput from "@/shared/components/form/CurrencyInput";
import { Event, SouvenirRules, SouvenirTier } from "@/entities/event/event.entity";
import { updateSouvenirRules } from "@/services/souvenir.service";

/** Quick editor (organizer) for the event's souvenir point rules & tiers. */
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
  const [usePoint, setUsePoint] = useState(initial.usePointSystem ?? false);
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
      const rules: SouvenirRules = usePoint
        ? {
            usePointSystem: true,
            boothVisitPoint: { enabled: boothOn, pointsPerVisit: boothPts },
            seminarPoint: { enabled: semOn, pointsPerSeminar: semPts },
            transactionPoint: {
              enabled: txOn,
              pointsPerTransaction: txPts,
              amountStep: txStep,
              pointsPerAmountStep: txStepPts,
            },
            tiers: tiers
              .filter((t) => t.name.trim())
              .map((t) => ({ id: t.id, name: t.name.trim(), minPoints: t.minPoints })),
          }
        : { ...initial, usePointSystem: false };
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
          {usePoint ? "Sistem poin aktif" : "Mode biasa"}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4 text-xs">
          <label className="flex items-center gap-2 font-semibold cursor-pointer">
            <input type="checkbox" checked={usePoint} onChange={(e) => setUsePoint(e.target.checked)} />
            Gunakan Sistem Poin &amp; Jenis Souvenir
          </label>

          {usePoint && (
            <>
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-gray-700">Jenis Souvenir &amp; Minimal Poin</p>
                  <button
                    type="button"
                    onClick={() =>
                      setTiers([...tiers, { id: crypto.randomUUID(), name: "", minPoints: 0 }])
                    }
                    className="font-semibold text-secondary cursor-pointer"
                  >
                    + Tambah Jenis
                  </button>
                </div>
                {tiers.map((tier, idx) => (
                  <div key={tier.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-6">
                      <Input
                        label="Nama Souvenir"
                        value={tier.name}
                        onChange={(e) =>
                          setTiers(tiers.map((t, i) => (i === idx ? { ...t, name: e.target.value } : t)))
                        }
                        placeholder="Totebag"
                      />
                    </div>
                    <div className="col-span-5">
                      <FormattedNumberInput
                        label="Minimal Poin"
                        value={tier.minPoints}
                        onChange={(v) =>
                          setTiers(tiers.map((t, i) => (i === idx ? { ...t, minPoints: Number(v) } : t)))
                        }
                        suffix="Poin"
                        placeholder="50"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setTiers(tiers.filter((_, i) => i !== idx))}
                      className="col-span-1 pb-3 text-gray-400 hover:text-red-500 cursor-pointer"
                      aria-label="Hapus jenis souvenir"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

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

