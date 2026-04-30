import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { 
  ChevronRight, 
  Copy, 
  Check, 
  Terminal, 
  Code, 
  Key, 
  Send, 
  FileText, 
  Shield, 
  Zap,
  Book,
  ArrowLeft,
  ChevronDown,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

const ApiDocs = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const sections = [
    {
      id: "auth",
      title: "Authentication",
      description: "To use the Endorse API, you need an API key. You can generate yours from the settings dashboard. All API requests must be made over HTTPS and include your key in the header.",
      icon: Key,
      code: `import requests

# Set your API Key
API_KEY = "your_api_key_here"
BASE_URL = "https://api.e-ndorse.online/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Example: Authenticating and getting account info
response = requests.get(f"{BASE_URL}/me", headers=headers)
print(response.json())`
    },
    {
      id: "send",
      title: "Send Document",
      description: "Send a document for signature by providing a base64 encoded PDF and a list of signers. Each signer will receive an email with a unique signing link.",
      icon: Send,
      code: `import requests
import base64

# Load your document
with open("contract.pdf", "rb") as f:
    pdf_base64 = base64.b64encode(f.read()).decode('utf-8')

payload = {
    "document_name": "Service Agreement",
    "pdf_base64": pdf_base64,
    "signers": [
        {"email": "client@example.com", "role": "Signer"},
        {"email": "manager@example.com", "role": "Viewer"}
    ]
}

response = requests.post(
    "https://api.e-ndorse.online/v1/documents/send",
    json=payload,
    headers=headers
)

document_id = response.json().get("id")
print(f"Document sent! ID: {document_id}")`
    },
    {
      id: "status",
      title: "Retrieve Status",
      description: "Check the current status of a document. Statuses include 'pending', 'viewed', 'signed', and 'expired'.",
      icon: FileText,
      code: `import requests

document_id = "doc_12345abc"

response = requests.get(
    f"https://api.e-ndorse.online/v1/documents/{document_id}",
    headers=headers
)

status = response.json().get("status")
print(f"Document Status: {status}")`
    },
    {
      id: "webhooks",
      title: "Webhooks",
      description: "Receive real-time notifications when a document is viewed or signed. Configure your webhook URL in the developer dashboard to start receiving JSON payloads.",
      icon: Zap,
      code: `# Example Webhook Payload (POST)
# {
#   "event": "document.signed",
#   "document_id": "doc_12345abc",
#   "signer_email": "client@example.com",
#   "timestamp": "2024-10-29T14:30:00Z"
# }

# Python Flask Example to receive webhooks
from flask import Flask, request

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def handle_webhook():
    data = request.json
    if data['event'] == 'document.signed':
        print(f"Doc {data['document_id']} was signed!")
    return "OK", 200`
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link to="/"><Logo className="h-12 md:h-20 w-auto" /></Link>
            <div className="h-4 w-px bg-border hidden md:block" />
            <div className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Book className="w-4 h-4" />
              API Documentation
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link to="/help-center">Help Center</Link>
            </Button>
            <Button asChild className="bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border/40 bg-muted/20 hidden lg:block overflow-y-auto">
          <div className="p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Introduction</h2>
            <nav className="space-y-1">
              <a href="#" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-primary/10 text-primary">Overview</a>
              <a href="#" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">Changelog</a>
            </nav>

            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-10 mb-4">API Reference</h2>
            <nav className="space-y-1">
              {sections.map(s => (
                <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                  <s.icon className="w-4 h-4" />
                  {s.title}
                </a>
              ))}
            </nav>

            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-10 mb-4">Support</h2>
            <nav className="space-y-1">
              <Link to="/help-center" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">Guides</Link>
              <a href="mailto:api-support@endorse.online" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">Contact Support</a>
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-5xl mx-auto py-12 px-6 lg:px-12">
            <header className="mb-16 border-b border-border pb-12">
              <h1 className="text-4xl font-bold tracking-tight mb-4">API Overview</h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                The Endorse API allows you to automate your document workflows, send signing requests, and receive real-time status updates via webhooks.
              </p>
              <div className="flex gap-4 mt-8">
                <div className="px-4 py-2 bg-green-500/10 text-green-600 rounded-lg text-sm font-bold border border-green-500/20 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Production Ready
                </div>
                <div className="px-4 py-2 bg-blue-500/10 text-blue-600 rounded-lg text-sm font-bold border border-blue-500/20 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  v1.2.0
                </div>
              </div>
            </header>

            <div className="space-y-24">
              {sections.map(section => (
                <section key={section.id} id={section.id} className="grid lg:grid-cols-2 gap-12 items-start">
                  {/* Left: Documentation */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <section.icon className="w-5 h-5" />
                      </div>
                      <h2 className="text-2xl font-bold">{section.title}</h2>
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      {section.description}
                    </p>
                    <div className="pt-4 flex items-center gap-4 text-sm font-medium text-primary">
                      <a href="#" className="flex items-center gap-1 hover:underline">
                        API Reference <ChevronRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Right: Code Block */}
                  <div className="relative group">
                    <div className="absolute -top-4 right-4 z-10 flex gap-2">
                       <div className="px-3 py-1 bg-background border border-border rounded-md text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Python</div>
                       <button 
                        onClick={() => copyToClipboard(section.code, section.id)}
                        className="p-1.5 bg-background border border-border rounded-md hover:bg-muted transition-colors"
                       >
                        {copiedSection === section.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                       </button>
                    </div>
                    <div className="rounded-xl overflow-hidden bg-[#0d1117] border border-white/10 shadow-2xl">
                      <pre className="p-6 text-sm font-mono leading-relaxed overflow-x-auto text-gray-300">
                        <code>{section.code}</code>
                      </pre>
                    </div>
                  </div>
                </section>
              ))}
            </div>

            {/* Open Source Contribution Section */}
            <section className="mt-20 p-8 rounded-2xl bg-blue-500/5 border border-blue-500/20">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold mb-3 flex items-center justify-center md:justify-start gap-2">
                    <Code className="w-6 h-6 text-blue-500" />
                    Help us improve these docs
                  </h2>
                  <p className="text-muted-foreground">
                    Our API Documentation is 100% open source. Found a typo or want to add a Python code sample? Contribute directly on GitHub and help us build the future of digital agreements.
                  </p>
                </div>
                <Button variant="outline" className="shrink-0 group" asChild>
                  <a href="https://github.com/endorse/docs-and-blog" target="_blank" rel="noopener noreferrer">
                    View on GitHub <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </a>
                </Button>
              </div>
            </section>

            {/* Next Steps */}
            <footer className="mt-32 pt-12 border-t border-border mb-20 text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to start building?</h2>
              <p className="text-muted-foreground mb-8">Generate your API key and start automating your business workflows today.</p>
              <div className="flex justify-center gap-4">
                <Button className="bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90" asChild>
                  <Link to="/dashboard">Get API Key</Link>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://github.com/endorse/sdk-python" target="_blank" rel="noopener noreferrer">
                    View Python SDK <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ApiDocs;
