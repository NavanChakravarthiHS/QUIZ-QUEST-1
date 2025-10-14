import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type Option = { id: string; text: string; };

type Question = {
  id: string;
  questionText: string;
  questionType: "single" | "multiple";
  options: Option[];
  correctOptionIds: string[];
  orderIndex: number;
};

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
  const [savedQuestions, setSavedQuestions] = useState<Question[]>([]);
  const [currentView, setCurrentView] = useState<"form" | "list">("form");
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    if (!quizId) navigate("/dashboard");
    else loadExistingQuestions();
  }, [quizId, navigate]);

  const loadExistingQuestions = async () => {
    if (!quizId) return;
    
    setLoading(true);
    try {
      const { data: questions, error } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order_index");

      if (error) throw error;

      if (questions && questions.length > 0) {
        const formattedQuestions: Question[] = questions.map((q: any) => ({
          id: q.id,
          questionText: q.question_text,
          questionType: q.question_type,
          options: q.options,
          correctOptionIds: q.correct_answers,
          orderIndex: q.order_index,
        }));
        setSavedQuestions(formattedQuestions);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load existing questions");
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => setOptions((prev) => [...prev, { id: crypto.randomUUID(), text: "" }]);
  const removeOption = (id: string) => setOptions((prev) => prev.filter((o) => o.id !== id));

  const toggleCorrect = (id: string) => {
    setCorrectOptionIds((prev) =>
      questionType === "single"
        ? (prev.includes(id) ? [] : [id])
        : (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
    );
  };

  const addQuestion = () => {
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

    const questionData = {
      questionText: questionText.trim(),
      questionType,
      options: filled,
      correctOptionIds: [...correctOptionIds],
    };

    if (editingQuestion) {
      // Update existing question
      const updatedQuestion: Question = {
        ...editingQuestion,
        ...questionData,
      };
      setSavedQuestions(prev => prev.map(q => q.id === editingQuestion.id ? updatedQuestion : q));
      toast.success("Question updated");
      setEditingQuestion(null);
    } else {
      // Add new question
      const newQuestion: Question = {
        id: crypto.randomUUID(),
        ...questionData,
        orderIndex: savedQuestions.length + 1,
      };
      setSavedQuestions(prev => [...prev, newQuestion]);
      toast.success("Question added to list");
    }
    
    // Reset for next question
    setQuestionText("");
    setQuestionType("single");
    setOptions([
      { id: crypto.randomUUID(), text: "" },
      { id: crypto.randomUUID(), text: "" },
    ]);
    setCorrectOptionIds([]);
  };

  const removeQuestion = (questionId: string) => {
    setSavedQuestions(prev => prev.filter(q => q.id !== questionId));
    toast.success("Question removed");
  };

  const editQuestion = (question: Question) => {
    setQuestionText(question.questionText);
    setQuestionType(question.questionType);
    setOptions(question.options);
    setCorrectOptionIds(question.correctOptionIds);
    setEditingQuestion(question);
    setCurrentView("form");
  };

  const cancelEdit = () => {
    setQuestionText("");
    setQuestionType("single");
    setOptions([
      { id: crypto.randomUUID(), text: "" },
      { id: crypto.randomUUID(), text: "" },
    ]);
    setCorrectOptionIds([]);
    setEditingQuestion(null);
  };

  const saveAllQuestions = async () => {
    if (savedQuestions.length === 0) {
      toast.error("No questions to save");
      return;
    }

    setSaving(true);
    try {
      // First, delete all existing questions for this quiz
      const { error: deleteError } = await supabase
        .from("questions")
        .delete()
        .eq("quiz_id", quizId);
      
      if (deleteError) throw deleteError;

      // Then insert all questions
      const questionsToSave = savedQuestions.map((q, index) => ({
        quiz_id: quizId,
        question_text: q.questionText,
        question_type: q.questionType,
        options: q.options.map((o) => ({ id: o.id, text: o.text })),
        correct_answers: q.correctOptionIds,
        order_index: index + 1,
      }));

      const { error } = await supabase.from("questions").insert(questionsToSave);
      if (error) throw error;
      
      toast.success(`${savedQuestions.length} questions saved successfully`);
      setCurrentView("form");
    } catch (err: any) {
      toast.error(err.message || "Failed to save questions");
    } finally {
      setSaving(false);
    }
  };

  const createQuiz = async () => {
    if (savedQuestions.length === 0) {
      toast.error("No questions to create quiz with");
      return;
    }

    setSaving(true);
    try {
      // First save all questions
      const questionsToSave = savedQuestions.map((q, index) => ({
        quiz_id: quizId,
        question_text: q.questionText,
        question_type: q.questionType,
        options: q.options.map((o) => ({ id: o.id, text: o.text })),
        correct_answers: q.correctOptionIds,
        order_index: index + 1,
      }));

      const { error: questionsError } = await supabase.from("questions").insert(questionsToSave);
      if (questionsError) throw questionsError;

      // Update quiz status to make it visible on dashboard
      const { error: quizError } = await supabase
        .from("quizzes")
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", quizId);

      if (quizError) throw quizError;
      
      toast.success(`Quiz created successfully with ${savedQuestions.length} questions!`);
      setSavedQuestions([]);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to create quiz");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading questions...</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Prepare Questions</CardTitle>
            <CardDescription>Add questions manually for your quiz. Save all questions when ready.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="form">Add Question</TabsTrigger>
                <TabsTrigger value="list">
                  Questions List ({savedQuestions.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="form" className="space-y-6 mt-6">
                {editingQuestion && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Editing Question:</strong> {editingQuestion.questionText}
                    </p>
                  </div>
                )}
                
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

                <div className="flex justify-between gap-2">
                  <Button type="button" variant="ghost" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
                  <div className="flex gap-2">
                    {editingQuestion && (
                      <Button type="button" variant="outline" onClick={cancelEdit}>
                        Cancel Edit
                      </Button>
                    )}
                    <Button type="button" variant="outline" onClick={() => setCurrentView("list")}>
                      View Questions ({savedQuestions.length})
                    </Button>
                    <Button type="button" onClick={addQuestion}>
                      {editingQuestion ? "Update Question" : "Add to List"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="list" className="space-y-6 mt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Saved Questions ({savedQuestions.length})</h3>
                    <p className="text-sm text-muted-foreground">Review and manage your questions before saving to database</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setCurrentView("form")}>
                      Add More Questions
                    </Button>
                    <Button 
                      type="button" 
                      onClick={saveAllQuestions} 
                      disabled={saving || savedQuestions.length === 0}
                      variant="outline"
                    >
                      Save Questions Only
                    </Button>
                    <Button 
                      type="button" 
                      onClick={createQuiz} 
                      disabled={saving || savedQuestions.length === 0}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {saving ? "Creating Quiz..." : `Create Quiz (${savedQuestions.length} questions)`}
                    </Button>
                  </div>
                </div>

                {savedQuestions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No questions added yet.</p>
                    <p>Go to "Add Question" tab to start creating questions.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedQuestions.map((question, index) => (
                      <Card key={question.id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Q{index + 1}</Badge>
                            <Badge variant={question.questionType === "single" ? "default" : "secondary"}>
                              {question.questionType === "single" ? "Single Choice" : "Multiple Choice"}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => editQuestion(question)}
                            >
                              Edit
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => removeQuestion(question.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                        
                        <p className="font-medium mb-3">{question.questionText}</p>
                        
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => (
                            <div key={option.id} className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                question.correctOptionIds.includes(option.id) 
                                  ? "bg-green-100 text-green-800 border border-green-300" 
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                {optIndex + 1}
                              </span>
                              <span className={`text-sm ${
                                question.correctOptionIds.includes(option.id) 
                                  ? "font-medium text-green-800" 
                                  : "text-gray-700"
                              }`}>
                                {option.text}
                                {question.correctOptionIds.includes(option.id) && " ✓"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default QuestionsBuilder;


