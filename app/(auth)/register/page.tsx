"use client";

import Link from "next/link";
import { signUp } from "@/lib/auth/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const handleSignUp = async (formData: FormData) => {
    await signUp(formData);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
        </CardHeader>

        <CardContent>
          <form action={handleSignUp} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>

            <Button type="submit" className="w-full">
              Sign up
            </Button>
          </form>

          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="underline" href="/login">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
