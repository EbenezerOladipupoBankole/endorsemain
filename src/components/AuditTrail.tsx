import { useState, useEffect } from 'react';
import { db } from '@/components/client';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Clock, 
  User, 
  Activity,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  timestamp: any;
  details: any;
}

export const AuditTrail = ({ documentId }: { documentId: string }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!documentId) return;

    const q = query(
      collection(db, "audit_logs"),
      where("documentId", "==", documentId),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditLog[];
      setLogs(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [documentId]);

  if (loading) return <div className="text-center py-4">Loading audit trail...</div>;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Audit Trail
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[300px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No audit logs recorded for this document.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log) => (
                <div key={log.id} className="p-3 hover:bg-muted/50 transition-colors space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">{log.action}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {log.timestamp?.seconds 
                        ? format(new Date(log.timestamp.seconds * 1000), 'MMM d, h:mm a') 
                        : 'Just now'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span>{log.performedBy}</span>
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 p-2 bg-muted/30 rounded border border-border/50">
                      {Object.entries(log.details).map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-[10px] text-foreground truncate">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
