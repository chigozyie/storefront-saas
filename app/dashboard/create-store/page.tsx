"use client";

import Link from "next/link";
import { createStore } from "@/lib/stores/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CreateStorePage() {
  const handleCreateStore = async (formData: FormData) => {
    await createStore(formData);
  }
  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Store</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <form action={handleCreateStore} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Store name</Label>
              <Input id="name" name="name" required placeholder="TechHub Gadgets" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="whatsapp">WhatsApp (optional)</Label>
              <Input id="whatsapp" name="whatsapp" placeholder="+234..." />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address (optional)</Label>
              <Input id="address" name="address" placeholder="Ikeja, Lagos" />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit">Create store</Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Cancel</Link>
              </Button>
            </div>
          </form>

          <p className="text-sm text-muted-foreground">
            Your store URL will look like <span className="font-medium">/ @yourstore</span>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
