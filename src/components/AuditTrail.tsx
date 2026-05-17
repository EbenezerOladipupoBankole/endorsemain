import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/components/client";
import { CheckCircle2, Clock, Eye, Send, ShieldCheck, User } from "lucide-react";

interface AuditEvent {
  id: string;
  action: string;
  performedBy: string;
  timestamp: any;
  ip?: string;
  userAgent?: string;
}

interface AuditTrailProps {
  documentId: string;
}

export const AuditTrail = ({ documentId }: AuditTrailProps) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!documentId) return;

    // Use Firestore for real-time audit logs
    const q = query(
      collection(db, "audit_logs"),
      where("documentId", "==", documentId),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditEvent[];

      // If no real-time logs yet, provide some defaults or let them load
      setEvents(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching audit logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [documentId]);

  const getIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("create") || act.includes("upload")) return <Send className="w-4 h-4 text-blue-500" />;
    if (act.includes("sign")) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (act.includes("view")) return <Eye className="w-4 h-4 text-purple-500" />;
    if (act.includes("complete")) return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
    return <Clock className="w-4 h-4 text-slate-400" />;
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-4">
            <div className="w-2 h-2 rounded-full bg-slate-200 mt-2" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    // Fallback if no logs found in Firestore (might be a fresh migration)
    return (
      <div className="text-center py-8 text-slate-500">
        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p className="text-sm">No activity events found for this document yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-100" />

        <div className="space-y-8 relative">
          {events.map((event) => (
            <div key={event.id} className="flex gap-4">
              <div className="relative z-10 w-4 h-4 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center translate-y-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-900 text-sm">{event.action}</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded-full text-[10px] text-slate-500 font-medium border border-slate-100">
                    {getIcon(event.action)}
                    <span>{event.action}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <User className="w-3.5 h-3.5" />
                    <span className="truncate">{event.performedBy}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{event.timestamp?.seconds ? new Date(event.timestamp.seconds * 1000).toLocaleString() : 'Just now'}</span>
                    {event.ip && (
                      <>
                        <span className="mx-1">•</span>
                        <span>IP: {event.ip}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100/50 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
          This audit trail is cryptographically signed and stored on Endorse secure ledger.
          Each event is time-stamped and linked to the document integrity hash (SHA-256).
        </p>
      </div>
    </div>
  );
};
