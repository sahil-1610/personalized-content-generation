import React, { useEffect, useState } from "react";
import { supabase, supabaseEnabled } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

interface OnboardingFormProps {
  user: { id: string; email?: string; full_name?: string; avatar_url?: string };
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

      try {
        console.log("Loading existing onboarding for user:", user.id);
        const { data, error } = await supabase
          .from("onboardings")
          .select("*")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error loading onboarding:", error);
          return;
        }

        if (!mounted) return;

        if (data && data.length > 0) {
          const onboarding = data[0]; // Get first record
          console.log("Found existing onboarding:", onboarding);
          setFullName(onboarding.full_name || fullName);
          setTitle(onboarding.title || "");
          setBio(onboarding.bio || "");
          setInterests(
            Array.isArray(onboarding.interests)
              ? onboarding.interests.join(", ")
              : onboarding.interests || ""
          );
        } else {
          console.log("No existing onboarding found for user:", user.id);
        }
      } catch (err) {
        console.error("Failed to load onboarding data:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log("Starting onboarding submission for user:", user);

    try {
      if (!supabaseEnabled) throw new Error("Supabase not configured");

      // Step 1: Ensure profile exists (with multiple attempts)
      let profileExists = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!profileExists && attempts < maxAttempts) {
        attempts++;
        console.log(`Profile check attempt ${attempts}/${maxAttempts}`);

        try {
          // Check if profile exists
          const { data: existingProfile, error: checkError } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .single();

          if (existingProfile) {
            profileExists = true;
            console.log("Profile found:", existingProfile);
            break;
          }

          if (checkError && checkError.code !== "PGRST116") {
            console.error("Profile check error:", checkError);
          }

          // Try to create profile
          console.log("Attempting to create profile...");
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert(
              {
                id: user.id,
                email: user.email,
                full_name: fullName || user.full_name || "User",
                avatar_url:
                  user.avatar_url ||
                  `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.email}`,
              },
              { onConflict: "id" }
            );

          if (!profileError) {
            profileExists = true;
            console.log("Profile created successfully");
            break;
          } else {
            console.error(
              `Profile creation attempt ${attempts} failed:`,
              profileError
            );

            // Wait a bit before retry
            if (attempts < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        } catch (err) {
          console.error(`Profile attempt ${attempts} error:`, err);
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      if (!profileExists) {
        throw new Error(
          "Unable to create or verify user profile after multiple attempts"
        );
      }

      // Step 2: Save onboarding data
      const payload = {
        user_id: user.id,
        full_name: fullName,
        title,
        bio,
        interests: interests
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      console.log("Saving onboarding data:", payload);

      const { error } = await supabase
        .from("onboardings")
        .upsert(payload, { onConflict: "user_id" });

      if (error) {
        console.error("Onboarding save error:", error);
        throw error;
      }

      console.log("Onboarding saved successfully");
      onComplete?.();
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Failed to save onboarding:", err);
      alert(
        `Failed to save onboarding data: ${
          err.message || "Unknown error"
        }. Please try again or contact support.`
      );
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
