// lib/uploadToCloudflare.ts
export async function uploadToCloudflare(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file, file.name); // 👈 matches your /api/image/cloudflare route

  const res = await fetch("/api/image/cloudflare", { method: "POST", body });
  if (!res.ok) throw new Error("Upload failed");

  // The route should respond { url: "https://…" }
  const { url } = (await res.json()) as { url: string };
  return url;
}
