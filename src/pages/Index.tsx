import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, Shield, TrendingUp, Zap, Lock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Clock,
      title: "Flexible Timing",
      description: "Choose between overall quiz timer or per-question countdown",
    },
    {
      icon: Shield,
      title: "Cheat-Free Environment",
      description: "Tab-switch detection and secure access controls",
    },
    {
      icon: Lock,
      title: "Secure Access",
      description: "Random access keys ensure only authorized participants",
    },
    {
      icon: CheckCircle2,
      title: "Auto-Submit",
      description: "Never lose your answers with automatic submission",
    },
    {
      icon: Zap,
      title: "Multiple Question Types",
      description: "Support for single and multiple-answer questions",
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Monitor performance and prevent duplicate attempts",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/QuizQuest%20Logo.png"
              alt="Quiz Quest Logo"
              className="h-8 w-8 rounded-sm shadow-sm"
              loading="eager"
              decoding="async"
            />
            <span className="font-semibold text-lg tracking-tight">Quiz Quest</span>
          </div>
          <nav className="hidden sm:flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/student-login")}>Student</Button>
            <Button variant="ghost" onClick={() => navigate("/teacher-login")}>Teacher</Button>
          </nav>
        </div>
      </header>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/10 to-background py-20 px-4">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Welcome to Quiz Quest!
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200">
            The ultimate platform for fair, secure, and engaging online quizzes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={() => navigate("/student-login")}
            >
              Student Login
            </Button>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8"
              onClick={() => navigate("/teacher-login")}
            >
              Teacher Login
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Why Choose Quiz Quest?
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Built with fairness and security at its core, Quiz Quest ensures every assessment is reliable and efficient
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <CardContent className="pt-6">
                  <feature.icon className="h-12 w-12 mb-4 text-primary" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      

      {/* Footer */}
      <footer className="border-t bg-background/70">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/QuizQuest%20Logo.png" alt="Quiz Quest" className="h-5 w-5 rounded-sm" />
            <span>© {new Date().getFullYear()} Quiz Quest. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="hover:text-foreground" onClick={() => navigate("/student-login")}>Student</button>
            <button className="hover:text-foreground" onClick={() => navigate("/teacher-login")}>Teacher</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
