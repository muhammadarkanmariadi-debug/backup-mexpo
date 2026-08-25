import { Eye, Loader2, Trash2, UserPlus } from "lucide-react";
import RowActions, { editAction } from "@/shared/components/ui/RowActions";
import { Workshop } from "@/entities/event/workshop.entity";
import { EventSpeaker } from "@/entities/event/speaker.entity";

interface Props {
  w: Workshop;
  speakers: EventSpeaker[];
  deletingId: string | null;
  busy: boolean;
  onAttachSpeaker: (id: string) => void;
  onViewSpeakers: (w: Workshop) => void;
  onEdit: (w: Workshop) => void;
  onRemove: (w: Workshop) => void;
}

export function WorkshopCard({ w, speakers, deletingId, busy, onAttachSpeaker, onViewSpeakers, onEdit, onRemove }: Props) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{w.title}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(w.start_time).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
            {" – "}
            {new Date(w.end_time).toLocaleString("id-ID", { timeStyle: "short" })}
            {" · "}
            {w.location} · kuota {w.quota > 0 ? w.quota : "∞"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => onAttachSpeaker(w.uuid)}
            disabled={(speakers ?? []).length === 0}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            <UserPlus className="h-3.5 w-3.5" /> Pembicara
          </button>
          <button
            onClick={() => onViewSpeakers(w)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <Eye className="h-3.5 w-3.5" /> Lihat
          </button>
          <RowActions
            actions={[
              editAction(() => onEdit(w), deletingId !== null),
              {
                key: "delete",
                icon: deletingId === w.uuid ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />,
                label: "Hapus",
                tone: "danger",
                onClick: () => onRemove(w),
                disabled: deletingId !== null,
              },
            ]}
            busy={busy || deletingId !== null}
          />
        </div>
      </div>
    </div>
  );
}
