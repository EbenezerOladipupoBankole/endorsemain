import{n as o,r as h,j as e,S as p,o as i,aC as u,C as b,A as g,B as a,m as f,k as j,E as y}from"./index-FBCUvB6q.js";import{T as v}from"./tag-Cz5c8Oue.js";import{C as w}from"./copy-vHq3VtRC.js";import{E as l}from"./external-link-D0vQ6HZz.js";import{A as N}from"./activity-CQIQMxlT.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=o("Github",[["path",{d:"M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4",key:"tonef"}],["path",{d:"M9 18c-4.51 2-5-2-7-2",key:"9comsn"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=o("Key",[["path",{d:"m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4",key:"g0fldk"}],["path",{d:"m21 2-9.6 9.6",key:"1j0ho8"}],["circle",{cx:"7.5",cy:"15.5",r:"5.5",key:"yqb3hr"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=o("Webhook",[["path",{d:"M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2",key:"q3hayz"}],["path",{d:"m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06",key:"1go1hn"}],["path",{d:"m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8",key:"qlwsc0"}]]),E=()=>{const[d,n]=h.useState(null),m=(s,x)=>{navigator.clipboard.writeText(s),n(x),j.success("Code copied to clipboard"),setTimeout(()=>n(null),2e3)},t=[{id:"auth",title:"Authentication",description:"To use the Endorse API, you need an API key. You can generate yours from the settings dashboard. All API requests must be made over HTTPS and include your key in the header.",icon:k,code:`import requests

# Set your API Key
API_KEY = "your_api_key_here"
BASE_URL = "https://api.e-ndorse.online/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Example: Authenticating and getting account info
response = requests.get(f"{BASE_URL}/me", headers=headers)
print(response.json())`},{id:"send",title:"Send Document",description:"Send a document for signature by providing a base64 encoded PDF and a list of signers. Each signer will receive an email with a unique signing link.",icon:y,code:`import requests
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
print(f"Document sent! ID: {document_id}")`},{id:"status",title:"Retrieve Status",description:"Check the current status of a document. Statuses include 'pending', 'viewed', 'signed', and 'expired'.",icon:N,code:`import requests

document_id = "doc_12345abc"

response = requests.get(
    f"https://api.e-ndorse.online/v1/documents/{document_id}",
    headers=headers
)

status = response.json().get("status")
print(f"Document Status: {status}")`},{id:"webhooks",title:"Webhooks",description:"Receive real-time notifications when a document is viewed or signed. Configure your webhook URL in the developer dashboard to start receiving JSON payloads.",icon:A,code:`# Example Webhook Payload (POST)
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
    return "OK", 200`}],r="flex min-h-10 items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground";return e.jsxs("div",{className:"min-h-screen bg-background flex flex-col",children:[e.jsx(p,{}),e.jsx("nav",{"aria-label":"API sections",className:"lg:hidden sticky top-16 md:top-20 z-40 border-b border-border/60 bg-background/95 backdrop-blur",children:e.jsxs("div",{className:"flex gap-2 overflow-x-auto px-4 py-2 sm:px-6 [scrollbar-width:none]",children:[e.jsx("a",{href:"#overview",className:"inline-flex h-10 shrink-0 items-center rounded-full bg-[#0A66C2]/10 px-4 text-sm font-semibold text-[#0A66C2]",children:"Overview"}),t.map(s=>e.jsxs("a",{href:`#${s.id}`,className:"inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-muted-foreground hover:border-[#0A66C2]/40 hover:text-[#0A66C2]",children:[s.icon&&e.jsx(s.icon,{className:"w-4 h-4"}),s.title]},s.id))]})}),e.jsxs("div",{className:"flex-1 lg:flex",children:[e.jsx("aside",{className:"hidden lg:block w-64 shrink-0 border-r border-border/40 bg-muted/20",children:e.jsxs("div",{className:"sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto p-6",children:[e.jsx("h2",{className:"text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4",children:"Introduction"}),e.jsx("nav",{className:"space-y-1",children:e.jsx("a",{href:"#overview",className:"flex min-h-10 items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-[#0A66C2]/10 text-[#0A66C2]",children:"Overview"})}),e.jsx("h2",{className:"text-xs font-bold uppercase tracking-widest text-muted-foreground mt-10 mb-4",children:"API Reference"}),e.jsx("nav",{className:"space-y-1",children:t.map(s=>e.jsxs("a",{href:`#${s.id}`,className:r,children:[s.icon&&e.jsx(s.icon,{className:"w-4 h-4"}),s.title]},s.id))}),e.jsx("h2",{className:"text-xs font-bold uppercase tracking-widest text-muted-foreground mt-10 mb-4",children:"Support"}),e.jsxs("nav",{className:"space-y-1",children:[e.jsx(i,{to:"/help-center",className:r,children:"Guides"}),e.jsx("a",{href:"mailto:api-support@e-ndorse.online",className:r,children:"Contact Support"})]})]})}),e.jsx("main",{className:"min-w-0 flex-1",children:e.jsxs("div",{className:"max-w-5xl mx-auto py-8 md:py-12 px-4 sm:px-6 lg:px-12",children:[e.jsxs("header",{id:"overview",className:"scroll-mt-36 mb-12 md:mb-16 border-b border-border pb-10 md:pb-12",children:[e.jsxs("div",{className:"mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[#0A66C2]",children:[e.jsx(u,{className:"w-4 h-4"}),"API Documentation"]}),e.jsx("h1",{className:"text-3xl md:text-4xl font-bold tracking-tight mb-4",children:"API Overview"}),e.jsx("p",{className:"text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl break-words",children:"The Endorse API allows you to automate your document workflows, send signing requests, and receive real-time status updates via webhooks."}),e.jsxs("div",{className:"flex flex-wrap gap-3 mt-6 md:mt-8",children:[e.jsxs("div",{className:"px-4 py-2 bg-green-500/10 text-green-700 rounded-lg text-sm font-bold border border-green-500/20 flex items-center gap-2",children:[e.jsx(b,{className:"w-4 h-4"}),"Production Ready"]}),e.jsxs("div",{className:"px-4 py-2 bg-[#0A66C2]/10 text-[#0A66C2] rounded-lg text-sm font-bold border border-[#0A66C2]/20 flex items-center gap-2",children:[e.jsx(v,{className:"w-4 h-4"}),"v1.2.0"]})]})]}),e.jsx("div",{className:"space-y-16 md:space-y-24",children:t.map(s=>e.jsxs("section",{id:s.id,className:"scroll-mt-36 lg:scroll-mt-28 grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-12 items-start",children:[e.jsxs("div",{className:"min-w-0 space-y-4",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-2 bg-primary/10 rounded-lg text-primary",children:s.icon&&e.jsx(s.icon,{className:"w-5 h-5"})}),e.jsx("h2",{className:"text-xl md:text-2xl font-bold",children:s.title})]}),e.jsx("p",{className:"text-muted-foreground leading-relaxed text-base md:text-lg break-words",children:s.description})]}),e.jsxs("div",{className:"min-w-0 rounded-xl overflow-hidden bg-[#0d1117] border border-white/10 shadow-xl",children:[e.jsxs("div",{className:"flex items-center justify-between border-b border-white/10 pl-4 pr-1",children:[e.jsx("span",{className:"text-xs font-bold uppercase tracking-wider text-gray-400",children:"Python"}),e.jsxs("button",{onClick:()=>m(s.code,s.id),className:"flex h-10 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-colors","aria-label":`Copy ${s.title} code`,children:[d===s.id?e.jsx(g,{className:"w-4 h-4 text-green-400"}):e.jsx(w,{className:"w-4 h-4"}),d===s.id?"Copied":"Copy"]})]}),e.jsx("pre",{className:"p-4 md:p-6 text-[13px] md:text-sm font-mono leading-relaxed overflow-x-auto text-gray-300",children:e.jsx("code",{children:s.code})})]})]},s.id))}),e.jsx("section",{className:"mt-16 md:mt-20 p-6 md:p-8 rounded-2xl bg-[#0A66C2]/5 border border-[#0A66C2]/20",children:e.jsxs("div",{className:"flex flex-col md:flex-row items-center gap-6 md:gap-8",children:[e.jsxs("div",{className:"flex-1 text-center md:text-left",children:[e.jsxs("h2",{className:"text-xl md:text-2xl font-bold mb-3 flex items-center justify-center md:justify-start gap-2",children:[e.jsx(c,{className:"w-6 h-6 shrink-0"}),"Help us improve these docs"]}),e.jsx("p",{className:"text-muted-foreground",children:"Our API Documentation is 100% open source. Found a typo or want to add a Python code sample? Contribute directly on GitHub and help us build the future of digital agreements."})]}),e.jsx(a,{variant:"outline",className:"h-12 w-full sm:w-auto shrink-0 rounded-full font-bold",asChild:!0,children:e.jsxs("a",{href:"https://github.com/endorse/docs-and-blog",target:"_blank",rel:"noopener noreferrer",children:[e.jsx(c,{className:"w-4 h-4 mr-2"})," View on GitHub ",e.jsx(l,{className:"w-4 h-4 ml-2"})]})})]})}),e.jsxs("section",{className:"mt-16 md:mt-24 pt-10 md:pt-12 border-t border-border mb-8 md:mb-12 text-center",children:[e.jsx("h2",{className:"text-2xl font-bold mb-4",children:"Ready to start building?"}),e.jsx("p",{className:"text-muted-foreground mb-8",children:"Generate your API key and start automating your business workflows today."}),e.jsxs("div",{className:"flex flex-col sm:flex-row justify-center gap-3 sm:gap-4",children:[e.jsx(a,{className:"h-12 rounded-full px-6 font-bold bg-[#FFC83D] text-black hover:bg-[#e6b435]",asChild:!0,children:e.jsx(i,{to:"/dashboard",children:"Get API Key"})}),e.jsx(a,{variant:"outline",className:"h-12 rounded-full px-6 font-bold border-[#0A66C2]/30 text-[#0A66C2] hover:bg-[#0A66C2]/5 hover:text-[#08519c]",asChild:!0,children:e.jsxs("a",{href:"https://github.com/endorse/sdk-python",target:"_blank",rel:"noopener noreferrer",children:["View Python SDK ",e.jsx(l,{className:"w-4 h-4 ml-2"})]})})]})]})]})})]}),e.jsx(f,{})]})};export{E as default};
