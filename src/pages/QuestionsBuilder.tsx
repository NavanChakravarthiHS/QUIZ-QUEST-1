import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type Option = { id: string; text: string; };

const QuestionsBuilder = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<"single" | "multiple">("single");
  const [options, setOptions] = useState<Option[]>([
    { id: crypto.randomUUID(), text: "" },
    { id: crypto.randomUUID(), text: "" },
  ]);
  const [correctOptionIds, setCorrectOptionIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!quizId) navigate("/dashboard");
  }, [quizId, navigate]);

  const addOption = () => setOptions((prev) => [...prev, { id: crypto.randomUUID(), text: "" }]);
  const removeOption = (id: string) => setOptions((prev) => prev.filter((o) => o.id !== id));

  const toggleCorrect = (id: string) => {
    setCorrectOptionIds((prev) =>
      questionType === "single"
        ? (prev.includes(id) ? [] : [id])
        : (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
    );
  };

  const saveQuestion = async () => {
    if (!quizId) return;
    if (!questionText.trim()) {
      toast.error("Question text is required");
      return;
    }
    const filled = options.filter((o) => o.text.trim() !== "");
    if (filled.length < 2) {
      toast.error("Provide at least two options");
      return;
    }
    if (correctOptionIds.length === 0) {
      toast.error("Select at least one correct answer");
      return;
    }
    setSaving(true);
    try {
      const orderIndex = Date.now();
      const { error } = await supabase.from("questions").insert({
        quiz_id: quizId,
        question_text: questionText,
        question_type: questionType,
        options: filled.map((o) => ({ id: o.id, text: o.text })),
        correct_answers: correctOptionIds,
        order_index: orderIndex,
      });
      if (error) throw error;
      toast.success("Question added");
      // Reset for next question
      setQuestionText("");
      setOptions([
        { id: crypto.randomUUID(), text: "" },
        { id: crypto.randomUUID(), text: "" },
      ]);
      setCorrectOptionIds([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Prepare Questions</CardTitle>
            <CardDescription>Add questions manually for your quiz.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="qtext">Question</Label>
              <Input id="qtext" value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Type your question here" />
            </div>

            <div className="space-y-2">
              <Label>Question Type</Label>
              <Tabs value={questionType} onValueChange={(v) => setQuestionType(v as any)}>
                <TabsList>
                  <TabsTrigger value="single">Single choice</TabsTrigger>
                  <TabsTrigger value="multiple">Multiple choice</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-3">
              <Label>Options</Label>
              {options.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    className={`h-9 px-3 rounded border ${correctOptionIds.includes(opt.id) ? "bg-primary text-primary-foreground" : "bg-background"}`}
                    onClick={() => toggleCorrect(opt.id)}
                    title={correctOptionIds.includes(opt.id) ? "Correct" : "Mark as correct"}
                  >
                    {correctOptionIds.includes(opt.id) ? "✓" : "○"}
                  </button>
                  <Input
                    value={opt.text}
                    onChange={(e) => setOptions((prev) => prev.map((o) => (o.id === opt.id ? { ...o, text: e.target.value } : o)))}
                    placeholder={`Option ${idx + 1}`}
                  />
                  {options.length > 2 && (
                    <Button type="button" variant="ghost" onClick={() => removeOption(opt.id)}>Remove</Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addOption}>Add option</Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => navigate("/dashboard")}>Done</Button>
              <Button type="button" onClick={saveQuestion} disabled={saving}>{saving ? "Saving..." : "Save Question"}</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default QuestionsBuilder;


