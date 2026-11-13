import{r as m,j as e,S as x,q as n,E as u,B as o,n as p,k as h}from"./index-D6Qic5w_.js";import{C as b}from"./copy-ynWHCRWi.js";import{E as i}from"./external-link-BICcyYXT.js";const v=()=>{const[d,a]=m.useState(null),l=(t,c)=>{navigator.clipboard.writeText(t),a(c),h.success("Code copied to clipboard"),setTimeout(()=>a(null),2e3)},s=[{id:"auth",title:"Authentication",description:"To use the Endorse API, you need an API key. You can generate yours from the settings dashboard. All API requests must be made over HTTPS and include your key in the header.",code:`import requests

# Set your API Key
API_KEY = "your_api_key_here"
BASE_URL = "https://api.e-ndorse.online/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Example: Authenticating and getting account info
response = requests.get(f"{BASE_URL}/me", headers=headers)
print(response.json())`},{id:"send",title:"Send Document",description:"Send a document for signature by providing a base64 encoded PDF and a list of signers. Each signer will receive an email with a unique signing link.",code:`import requests
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
print(f"Document sent! ID: {document_id}")`},{id:"status",title:"Retrieve Status",description:"Check the current status of a document. Statuses include 'pending', 'viewed', 'signed', and 'expired'.",code:`import requests

document_id = "doc_12345abc"

response = requests.get(
    f"https://api.e-ndorse.online/v1/documents/{document_id}",
    headers=headers
)

status = response.json().get("status")
print(f"Document Status: {status}")`},{id:"webhooks",title:"Webhooks",description:"Receive real-time notifications when a document is viewed or signed. Configure your webhook URL in the developer dashboard to start receiving JSON payloads.",code:`# Example Webhook Payload (POST)
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
    return "OK", 200`}],r="flex min-h-10 items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground";return e.jsxs("div",{className:"min-h-screen bg-background flex flex-col",children:[e.jsx(x,{}),e.jsx("nav",{"aria-label":"API sections",className:"lg:hidden sticky top-16 md:top-20 z-40 border-b border-border/60 bg-background/95 backdrop-blur",children:e.jsxs("div",{className:"flex gap-2 overflow-x-auto px-4 py-2 sm:px-6 [scrollbar-width:none]",children:[e.jsx("a",{href:"#overview",className:"inline-flex h-10 shrink-0 items-center rounded-full bg-[#0A66C2]/10 px-4 text-sm font-semibold text-[#0A66C2]",children:"Overview"}),s.map(t=>e.jsx("a",{href:`#${t.id}`,className:"inline-flex h-10 shrink-0 items-center rounded-full border border-border px-4 text-sm font-medium text-muted-foreground hover:border-[#0A66C2]/40 hover:text-[#0A66C2]",children:t.title},t.id))]})}),e.jsxs("div",{className:"flex-1 lg:flex",children:[e.jsx("aside",{className:"hidden lg:block w-64 shrink-0 border-r border-border/40 bg-muted/20",children:e.jsxs("div",{className:"sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto p-6",children:[e.jsx("h2",{className:"text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4",children:"Introduction"}),e.jsx("nav",{className:"space-y-1",children:e.jsx("a",{href:"#overview",className:"flex min-h-10 items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-[#0A66C2]/10 text-[#0A66C2]",children:"Overview"})}),e.jsx("h2",{className:"text-xs font-bold uppercase tracking-widest text-muted-foreground mt-10 mb-4",children:"API Reference"}),e.jsx("nav",{className:"space-y-1",children:s.map(t=>e.jsx("a",{href:`#${t.id}`,className:r,children:t.title},t.id))}),e.jsx("h2",{className:"text-xs font-bold uppercase tracking-widest text-muted-foreground mt-10 mb-4",children:"Support"}),e.jsxs("nav",{className:"space-y-1",children:[e.jsx(n,{to:"/help-center",className:r,children:"Guides"}),e.jsx("a",{href:"mailto:api-support@e-ndorse.online",className:r,children:"Contact Support"})]})]})}),e.jsx("main",{className:"min-w-0 flex-1",children:e.jsxs("div",{className:"max-w-5xl mx-auto py-8 md:py-12 px-4 sm:px-6 lg:px-12",children:[e.jsxs("header",{id:"overview",className:"scroll-mt-36 mb-12 md:mb-16 border-b border-border pb-10 md:pb-12",children:[e.jsx("div",{className:"mb-3 text-sm font-semibold text-[#0A66C2]",children:"API Documentation"}),e.jsx("h1",{className:"text-3xl md:text-4xl font-bold tracking-tight mb-4",children:"API Overview"}),e.jsx("p",{className:"text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl break-words",children:"The Endorse API allows you to automate your document workflows, send signing requests, and receive real-time status updates via webhooks."}),e.jsxs("div",{className:"flex flex-wrap gap-3 mt-6 md:mt-8",children:[e.jsx("div",{className:"px-4 py-2 bg-green-500/10 text-green-700 rounded-lg text-sm font-bold border border-green-500/20",children:"Production Ready"}),e.jsx("div",{className:"px-4 py-2 bg-[#0A66C2]/10 text-[#0A66C2] rounded-lg text-sm font-bold border border-[#0A66C2]/20",children:"v1.2.0"})]})]}),e.jsx("div",{className:"space-y-16 md:space-y-24",children:s.map(t=>e.jsxs("section",{id:t.id,className:"scroll-mt-36 lg:scroll-mt-28 grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-12 items-start",children:[e.jsxs("div",{className:"min-w-0 space-y-4",children:[e.jsx("h2",{className:"text-xl md:text-2xl font-bold",children:t.title}),e.jsx("p",{className:"text-muted-foreground leading-relaxed text-base md:text-lg break-words",children:t.description})]}),e.jsxs("div",{className:"min-w-0 rounded-xl overflow-hidden bg-[#0d1117] border border-white/10 shadow-xl",children:[e.jsxs("div",{className:"flex items-center justify-between border-b border-white/10 pl-4 pr-1",children:[e.jsx("span",{className:"text-xs font-bold uppercase tracking-wider text-gray-400",children:"Python"}),e.jsxs("button",{onClick:()=>l(t.code,t.id),className:"flex h-10 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-colors","aria-label":`Copy ${t.title} code`,children:[d===t.id?e.jsx(u,{className:"w-4 h-4 text-green-400"}):e.jsx(b,{className:"w-4 h-4"}),d===t.id?"Copied":"Copy"]})]}),e.jsx("pre",{className:"p-4 md:p-6 text-[13px] md:text-sm font-mono leading-relaxed overflow-x-auto text-gray-300",children:e.jsx("code",{children:t.code})})]})]},t.id))}),e.jsx("section",{className:"mt-16 md:mt-20 p-6 md:p-8 rounded-2xl bg-[#0A66C2]/5 border border-[#0A66C2]/20",children:e.jsxs("div",{className:"flex flex-col md:flex-row items-center gap-6 md:gap-8",children:[e.jsxs("div",{className:"flex-1 text-center md:text-left",children:[e.jsx("h2",{className:"text-xl md:text-2xl font-bold mb-3",children:"Help us improve these docs"}),e.jsx("p",{className:"text-muted-foreground",children:"Our API Documentation is 100% open source. Found a typo or want to add a Python code sample? Contribute directly on GitHub and help us build the future of digital agreements."})]}),e.jsx(o,{variant:"outline",className:"h-12 w-full sm:w-auto shrink-0 rounded-full font-bold",asChild:!0,children:e.jsxs("a",{href:"https://github.com/endorse/docs-and-blog",target:"_blank",rel:"noopener noreferrer",children:["View on GitHub ",e.jsx(i,{className:"w-4 h-4 ml-2"})]})})]})}),e.jsxs("section",{className:"mt-16 md:mt-24 pt-10 md:pt-12 border-t border-border mb-8 md:mb-12 text-center",children:[e.jsx("h2",{className:"text-2xl font-bold mb-4",children:"Ready to start building?"}),e.jsx("p",{className:"text-muted-foreground mb-8",children:"Generate your API key and start automating your business workflows today."}),e.jsxs("div",{className:"flex flex-col sm:flex-row justify-center gap-3 sm:gap-4",children:[e.jsx(o,{className:"h-12 rounded-full px-6 font-bold bg-[#FFC83D] text-black hover:bg-[#e6b435]",asChild:!0,children:e.jsx(n,{to:"/dashboard",children:"Get API Key"})}),e.jsx(o,{variant:"outline",className:"h-12 rounded-full px-6 font-bold border-[#0A66C2]/30 text-[#0A66C2] hover:bg-[#0A66C2]/5 hover:text-[#08519c]",asChild:!0,children:e.jsxs("a",{href:"https://github.com/endorse/sdk-python",target:"_blank",rel:"noopener noreferrer",children:["View Python SDK ",e.jsx(i,{className:"w-4 h-4 ml-2"})]})})]})]})]})})]}),e.jsx(p,{})]})};export{v as default};
