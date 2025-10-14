import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

function generateAccessKey(): string {
  const segment = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${segment()}-${segment()}-${segment()}`;
}

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timerMode, setTimerMode] = useState<"overall" | "per_question">("overall");
  const [totalTimeMinutes, setTotalTimeMinutes] = useState<number | "">("");
  const [questionTimeSeconds, setQuestionTimeSeconds] = useState<number | "">("");
  const [accessKey, setAccessKey] = useState<string>(generateAccessKey());
  const [submitting, setSubmitting] = useState(false);

  const handleGenerate = () => setAccessKey(generateAccessKey());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (timerMode === "overall" && !totalTimeMinutes) {
      toast.error("Please set total time in minutes");
      return;
    }
    if (timerMode === "per_question" && !questionTimeSeconds) {
      toast.error("Please set per-question time in seconds");
      return;
    }

    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) throw new Error("Not authenticated");

      const { data, error } = await supabase.from("quizzes").insert({
        title,
        description,
        created_by: userId,
        access_key: accessKey,
        timer_mode: timerMode,
        total_time_minutes: timerMode === "overall" ? Number(totalTimeMinutes) : null,
        question_time_seconds: timerMode === "per_question" ? Number(questionTimeSeconds) : null,
        is_active: true,
      }).select("id").single();

      if (error) throw error;
      const createdId = data?.id;
      toast.success("Quiz created successfully. Now add questions.");
      if (createdId) {
        navigate(`/quiz/${createdId}/questions`);
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create quiz");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="/QuizQuest Logo.png" 
              alt="QuizQuest Logo" 
              className="h-8 w-8 object-contain"
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Quiz Quest
            </h1>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create a New Quiz</CardTitle>
            <CardDescription>Set quiz details, timing mode, and share the access code with students.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Chapter 5 Assessment" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
              </div>

              <div className="space-y-3">
                <Label>Timer Mode</Label>
                <RadioGroup value={timerMode} onValueChange={(v) => setTimerMode(v as any)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border rounded-md p-3 flex items-center gap-3">
                    <RadioGroupItem id="mode-overall" value="overall" />
                    <Label htmlFor="mode-overall" className="cursor-pointer">Overall quiz time</Label>
                  </div>
                  <div className="border rounded-md p-3 flex items-center gap-3">
                    <RadioGroupItem id="mode-perq" value="per_question" />
                    <Label htmlFor="mode-perq" className="cursor-pointer">Per-question timer</Label>
                  </div>
                </RadioGroup>
              </div>

              {timerMode === "overall" ? (
                <div className="space-y-2">
                  <Label htmlFor="total-mins">Total time (minutes)</Label>
                  <Input id="total-mins" type="number" min={1} value={totalTimeMinutes as any} onChange={(e) => setTotalTimeMinutes(e.target.value ? Number(e.target.value) : "")} />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="per-sec">Per-question time (seconds)</Label>
                  <Input id="per-sec" type="number" min={5} value={questionTimeSeconds as any} onChange={(e) => setQuestionTimeSeconds(e.target.value ? Number(e.target.value) : "")} />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="access">Access code</Label>
                <div className="flex gap-2">
                  <Input id="access" value={accessKey} readOnly />
                  <Button type="button" variant="outline" onClick={handleGenerate}>Regenerate</Button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => navigate("/dashboard")}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Quiz"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateQuiz;


