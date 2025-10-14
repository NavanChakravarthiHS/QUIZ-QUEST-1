import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Share2, X } from "lucide-react";
import { toast } from "sonner";

interface QuizShareModalProps {
  quiz: {
    id: string;
    title: string;
    access_key: string;
    timer_mode: "overall" | "per_question";
    total_time_minutes: number | null;
    question_time_seconds: number | null;
  };
  isOpen: boolean;
  onClose: () => void;
}

const QuizShareModal = ({ quiz, isOpen, onClose }: QuizShareModalProps) => {
  const [copied, setCopied] = useState(false);
  
  if (!isOpen) return null;

  const quizUrl = `${window.location.origin}/quiz/${quiz.id}`;
  const shareText = `Join my quiz "${quiz.title}" using access code: ${quiz.access_key}\n\nQuiz Link: ${quizUrl}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const shareQuiz = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Quiz: ${quiz.title}`,
          text: shareText,
          url: quizUrl,
        });
      } catch (err) {
        // User cancelled sharing or error occurred
        console.log("Share cancelled or failed");
      }
    } else {
      // Fallback to copying
      copyToClipboard(shareText);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg">Share Quiz</CardTitle>
            <CardDescription>Share this quiz with your students</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quiz Title</Label>
            <p className="text-sm text-muted-foreground">{quiz.title}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Access Code</Label>
            <div className="flex gap-2">
              <Input value={quiz.access_key} readOnly className="font-mono" />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copyToClipboard(quiz.access_key)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Quiz Link</Label>
            <div className="flex gap-2">
              <Input value={quizUrl} readOnly className="text-xs" />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copyToClipboard(quizUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Timer Settings</Label>
            <Badge variant="outline" className="text-xs">
              {quiz.timer_mode === "overall" 
                ? `${quiz.total_time_minutes} minutes total`
                : `${quiz.question_time_seconds} seconds per question`
              }
            </Badge>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Share Instructions</Label>
            <div className="p-3 bg-muted rounded-md text-sm">
              <p className="mb-2">Students can join this quiz by:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Visiting the quiz link above</li>
                <li>Entering the access code: <code className="bg-background px-1 rounded">{quiz.access_key}</code></li>
                <li>Starting the quiz</li>
              </ol>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={shareQuiz} 
              className="flex-1"
              disabled={copied}
            >
              <Share2 className="h-4 w-4 mr-2" />
              {copied ? "Copied!" : "Share Quiz"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizShareModal;
