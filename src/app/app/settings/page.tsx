"use client";

import { KeyRound, Save, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, SelectField } from "@/components/ui/field";
import { useFinance } from "@/components/finance-provider";
import { currencies } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SettingsPage() {
  const { profile, updateProfile, currency, setCurrency } = useFinance();
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setAvatarUrl(profile?.avatar_url ?? "");
  }, [profile]);

  async function saveProfile() {
    await updateProfile({ full_name: fullName, avatar_url: avatarUrl });
  }

  async function changePassword() {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    try {
      const { error } = await createSupabaseBrowserClient().auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password updated");
      }
      setPassword("");
    } catch {
      toast.error("Connect Supabase to update passwords.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><User size={20} /> Profile</h2>
        <div className="grid gap-4">
          <Field label="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          <Field label="Email" value={profile?.email ?? ""} disabled />
          <Field label="Avatar URL" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} />
          <Button onClick={saveProfile}><Save size={18} /> Save profile</Button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><KeyRound size={20} /> Security & preferences</h2>
        <div className="grid gap-4">
          <Field label="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <Button onClick={changePassword}>Change password</Button>
          <SelectField label="Currency" value={currency} onChange={(event) => setCurrency(event.target.value)}>
            {currencies.map((item) => <option key={item} value={item}>{item}</option>)}
          </SelectField>
          <p className="rounded-md bg-mint/10 p-3 text-sm text-ink/70 dark:text-white/70">
            Dark mode is available from the top bar and is stored locally for each device.
          </p>
        </div>
      </Card>
    </div>
  );
}
