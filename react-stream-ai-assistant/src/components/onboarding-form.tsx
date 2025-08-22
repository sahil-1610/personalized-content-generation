import React, { useEffect, useState } from "react";
import { supabase, supabaseEnabled } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

interface OnboardingFormProps {
  user: { id: string; email?: string; full_name?: string };
  onComplete?: () => void;
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({
  user,
  onComplete,
}) => {
  const [fullName, setFullName] = useState(user.full_name || "");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // load existing onboarding if present
    let mounted = true;
    (async () => {
      if (!supabaseEnabled) return;
      const { data } = await supabase
        .from("onboardings")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (!mounted) return;
      if (data) {
        setFullName(data.full_name || fullName);
        setTitle(data.title || "");
        setBio(data.bio || "");
        setInterests(
          Array.isArray(data.interests)
            ? data.interests.join(", ")
            : data.interests || ""
        );
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        user_id: user.id,
        full_name: fullName,
        title,
        bio,
        interests: interests
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      } as any;

      if (!supabaseEnabled) throw new Error("Supabase not configured");

      const { error } = await supabase
        .from("onboardings")
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      onComplete?.();
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Failed to save onboarding:", err);
      alert("Failed to save onboarding data. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-lg font-semibold mb-4">
        Tell us a bit about yourself
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Full name</Label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <Label>Title / Role</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <Label>Short bio</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>

        <div>
          <Label>Interests (comma separated)</Label>
          <Input
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save and Continue"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/", { replace: true })}
          >
            Skip
          </Button>
        </div>
      </form>
    </div>
  );
};
