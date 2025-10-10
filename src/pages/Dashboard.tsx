import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User } from "@supabase/supabase-js";
import { PlusCircle, LogOut, Shield, BookOpen, ClipboardCheck, Clock, Users, Eye } from "lucide-react";
import { toast } from "sonner";

type Quiz = {
  id: string;
  title: string;
  description: string | null;
  access_key: string;
  timer_mode: "overall" | "per_question";
  total_time_minutes: number | null;
  question_time_seconds: number | null;
  is_active: boolean;
  created_at: string;
  question_count?: number;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [loading, setLoading] = useState(true);
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchQuizzes();
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      setUser(session.user);
      await fetchUserRole(session.user.id);
    }
    setLoading(false);
  };

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (data && !error) {
      setUserRole(data.role);
    }
  };

  const fetchQuizzes = async () => {
    setQuizzesLoading(true);
    try {
      // Fetch available quizzes (active quizzes)
      const { data: availableData, error: availableError } = await supabase
        .from("quizzes")
        .select(`
          id,
          title,
          description,
          access_key,
          timer_mode,
          total_time_minutes,
          question_time_seconds,
          is_active,
          created_at,
          questions(count)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (availableError) throw availableError;

      // Fetch my quizzes (created by current user)
      const { data: myData, error: myError } = await supabase
        .from("quizzes")
        .select(`
          id,
          title,
          description,
          access_key,
          timer_mode,
          total_time_minutes,
          question_time_seconds,
          is_active,
          created_at,
          questions(count)
        `)
        .eq("created_by", user?.id)
        .order("created_at", { ascending: false });

      if (myError) throw myError;

      // Process available quizzes
      const processedAvailable = availableData?.map(quiz => ({
        ...quiz,
        question_count: Array.isArray(quiz.questions) ? quiz.questions.length : 0
      })) || [];

      // Process my quizzes
      const processedMy = myData?.map(quiz => ({
        ...quiz,
        question_count: Array.isArray(quiz.questions) ? quiz.questions.length : 0
      })) || [];

      setAvailableQuizzes(processedAvailable);
      setMyQuizzes(processedMy);
    } catch (error: any) {
      console.error("Error fetching quizzes:", error);
      toast.error("Failed to load quizzes");
    } finally {
      setQuizzesLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isTeacherOrAdmin = userRole === "teacher" || userRole === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Quiz Quest
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span className="capitalize">{userRole}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">
            {isTeacherOrAdmin 
              ? "Create and manage your quizzes" 
              : "Take quizzes and track your progress"}
          </p>
        </div>

        <Tabs defaultValue={isTeacherOrAdmin ? "my-quizzes" : "available"} className="space-y-6">
          <TabsList>
            <TabsTrigger value="available">
              <BookOpen className="h-4 w-4 mr-2" />
              Available Quizzes
            </TabsTrigger>
            {isTeacherOrAdmin && (
              <TabsTrigger value="my-quizzes">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                My Quizzes
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Available Quizzes</CardTitle>
                <CardDescription>Browse and take active quizzes</CardDescription>
              </CardHeader>
              <CardContent>
                {quizzesLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading quizzes...</p>
                  </div>
                ) : availableQuizzes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No quizzes available yet</p>
                    <p className="text-sm">Check back later for new quizzes</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {availableQuizzes.map((quiz) => (
                      <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{quiz.title}</CardTitle>
                            <Badge variant="outline">{quiz.question_count} questions</Badge>
                          </div>
                          {quiz.description && (
                            <CardDescription className="text-sm">{quiz.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {quiz.timer_mode === "overall" 
                                  ? `${quiz.total_time_minutes} minutes total`
                                  : `${quiz.question_time_seconds} seconds per question`
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>Access Code: {quiz.access_key}</span>
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <Button size="sm" className="flex-1">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isTeacherOrAdmin && (
            <TabsContent value="my-quizzes" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => navigate("/create-quiz")}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create New Quiz
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Your Quizzes</CardTitle>
                  <CardDescription>Manage your created quizzes</CardDescription>
                </CardHeader>
                <CardContent>
                  {quizzesLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading your quizzes...</p>
                    </div>
                  ) : myQuizzes.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ClipboardCheck className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>No quizzes created yet</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => navigate("/create-quiz")}
                      >
                        Create your first quiz
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {myQuizzes.map((quiz) => (
                        <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{quiz.title}</CardTitle>
                              <div className="flex gap-2">
                                <Badge variant="outline">{quiz.question_count} questions</Badge>
                                <Badge variant={quiz.is_active ? "default" : "secondary"}>
                                  {quiz.is_active ? "Active" : "Draft"}
                                </Badge>
                              </div>
                            </div>
                            {quiz.description && (
                              <CardDescription className="text-sm">{quiz.description}</CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {quiz.timer_mode === "overall" 
                                    ? `${quiz.total_time_minutes} minutes total`
                                    : `${quiz.question_time_seconds} seconds per question`
                                  }
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>Access Code: {quiz.access_key}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Created: {new Date(quiz.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                              <Button size="sm" variant="outline" className="flex-1">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              <Button size="sm" variant="outline">
                                Edit
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
