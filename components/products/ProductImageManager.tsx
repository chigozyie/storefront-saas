"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ImgRow = {
  id: string;
  image_url: string;
  sort_order: number;
};

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export default function ProductImageManager({
  productId,
  initialImages,
}: {
  productId: string;
  initialImages: ImgRow[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [images, setImages] = useState<ImgRow[]>(initialImages ?? []);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setMsg(null);
    setUploading(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !["jpg", "jpeg", "png", "webp"].includes(ext)) {
        setMsg("Please upload an image (jpg, png, webp).");
        return;
      }

      // Unique path per file
      const filePath = `${productId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;

      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("product-images").getPublicUrl(filePath);
      const publicUrl = pub.publicUrl;

      // Save in DB
      const nextSort = images.length ? Math.max(...images.map((i) => i.sort_order)) + 1 : 0;

      const { data: row, error: dbErr } = await supabase
        .from("product_images")
        .insert({
          product_id: productId,
          image_url: publicUrl,
          sort_order: nextSort,
        })
        .select("id, image_url, sort_order")
        .single();

      if (dbErr) throw dbErr;

      setImages((prev) => [row as ImgRow, ...prev]);
      setMsg("Uploaded.");
    } catch (e: any) {
      setMsg(e?.message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(img: ImgRow) {
    setMsg(null);

    try {
      // Remove from storage too (best practice)
      // Extract object path from public URL
      const url = new URL(img.image_url);
      const parts = url.pathname.split("/storage/v1/object/public/product-images/");
      const objectPath = parts[1];

      if (objectPath) {
        const { error: delStorageErr } = await supabase.storage
          .from("product-images")
          .remove([objectPath]);
        if (delStorageErr) throw delStorageErr;
      }

      const { error: delDbErr } = await supabase.from("product_images").delete().eq("id", img.id);
      if (delDbErr) throw delDbErr;

      setImages((prev) => prev.filter((x) => x.id !== img.id));
      setMsg("Deleted.");
    } catch (e: any) {
      setMsg(e?.message ?? "Delete failed.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
            e.currentTarget.value = "";
          }}
        />
        {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      </div>

      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">No images yet. Upload one.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img) => (
            <div key={img.id} className="rounded-lg border p-2">
              <div className="aspect-square overflow-hidden rounded-md bg-muted">
                {/* Using <img> keeps it simple for MVP */}
                <img
                  src={img.image_url}
                  alt="Product"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="mt-2 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => void handleDelete(img)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Tip: Keep images under ~1–2MB for faster storefront loading.
      </p>
    </div>
  );
}
