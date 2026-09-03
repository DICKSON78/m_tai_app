import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import api from "../services/api";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export async function downloadPdf(url, filename = "document.pdf") {
  const res = await api.get(url, { responseType: "blob" });
  const contentType = res.headers["content-type"] || "";
  if (contentType.includes("json")) {
    const text = await res.data.text();
    let message = "Failed to generate PDF";
    try { message = JSON.parse(text)?.message || message; } catch {}
    throw new Error(message);
  }
  const blobUrl = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

export async function printPdf(url) {
  const res = await api.get(url);
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.open();
  win.document.write(res.data);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 800);
}

export function printElementAsPdf(elementId, title) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<html><head><title>${title || "Document"}</title><style>
    body{font-family:'Poppins',sans-serif;color:#333;padding:24px;}
    h1{font-size:20px;margin:0 0 4px;} .sub{color:#666;font-size:12px;margin-bottom:16px;}
    table{width:100%;border-collapse:collapse;margin-top:12px;} td,th{padding:8px;border-bottom:1px solid #eee;text-align:left;font-size:13px;}
    th{background:#f5f5f5;}
  </style></head><body>
    <h1>${title || "Document"}</h1>
    <div class="sub">Generated: ${new Date().toLocaleString()}</div>
    <div id="copy"></div>
    <script>document.addEventListener('DOMContentLoaded',function(){
      var src=opener.document.getElementById('${elementId}').cloneNode(true);
      src.querySelectorAll('input,select,button,svg').forEach(function(b){if(b.remove)b.remove()});
      document.getElementById('copy').appendChild(src);
      setTimeout(function(){window.print()},700); });
    <\/script>
  </body></html>`);
  win.document.close();
}
