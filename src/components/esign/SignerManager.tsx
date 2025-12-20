import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, X, Send } from "lucide-react";
import { toast } from "sonner";

export interface Signer {
  email: string;
  name: string;
}

interface SignerManagerProps {
  signers: Signer[];
  setSigners: React.Dispatch<React.SetStateAction<Signer[]>>;
  onSendInvites: () => void;
}

export const SignerManager = ({ signers, setSigners, onSendInvites }: SignerManagerProps) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const addSigner = () => {
    if (!email || !name) {
      toast.error("Please enter both name and email for the signer.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (signers.some(signer => signer.email === email)) {
      toast.warning("This signer has already been added.");
      return;
    }
    setSigners([...signers, { email, name }]);
    setEmail("");
    setName("");
  };

  const removeSigner = (emailToRemove: string) => {
    setSigners(signers.filter(signer => signer.email !== emailToRemove));
  };

  return (
    <Card className="gradient-card border-border/50 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display font-semibold">Invite Others to Sign</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input placeholder="Signer's Name" value={name} onChange={e => setName(e.target.value)} />
          <Input type="email" placeholder="Signer's Email" value={email} onChange={e => setEmail(e.target.value)} />
          <Button variant="outline" className="w-full" onClick={addSigner}>
            <UserPlus className="w-4 h-4 mr-2" /> Add Signer
          </Button>
        </div>
        <div className="space-y-2">
          {signers.map(signer => (
            <div key={signer.email} className="flex items-center justify-between bg-background/50 p-2 rounded-md text-sm">
              <div>
                <p className="font-medium">{signer.name}</p>
                <p className="text-muted-foreground">{signer.email}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeSigner(signer.email)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        {signers.length > 0 && (
          <Button className="w-full" onClick={onSendInvites}><Send className="w-4 h-4 mr-2" />Send Invites</Button>
        )}
      </CardContent>
    </Card>
  );
};