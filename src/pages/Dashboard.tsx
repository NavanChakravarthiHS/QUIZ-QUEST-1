import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "@supabase/supabase-js";
import { PlusCircle, LogOut, Shield, BookOpen, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [loading, setLoading] = useState(true);

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
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No quizzes available yet</p>
                  <p className="text-sm">Check back later for new quizzes</p>
                </div>
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
