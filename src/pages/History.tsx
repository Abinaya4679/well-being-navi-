import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, AlertCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const History = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searches, setSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSearch, setSelectedSearch] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchSearches();
    }
  }, [user, authLoading, navigate]);

  const fetchSearches = async () => {
    try {
      const { data, error } = await supabase
        .from('health_searches')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSearches(data || []);
    } catch (error: any) {
      console.error('Error fetching searches:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('health_searches').delete().eq('id', id);

      if (error) throw error;
      setSearches(searches.filter((s) => s.id !== id));
      toast.success('Search deleted');
    } catch (error: any) {
      console.error('Error deleting search:', error);
      toast.error('Failed to delete search');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Health History</h1>
            <p className="text-xs text-muted-foreground">View your past health searches</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {searches.length === 0 ? (
          <Card className="text-center p-12">
            <CardContent>
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No history yet</h3>
              <p className="text-muted-foreground mb-4">
                Start a health chat to see your search history here
              </p>
              <Button onClick={() => navigate('/chat')} className="gradient-primary text-white">
                Start Chat
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {searches.map((search) => (
              <Card key={search.id} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{search.symptoms}</CardTitle>
                        <Badge
                          variant={
                            search.severity_level === 'high'
                              ? 'destructive'
                              : search.severity_level === 'medium'
                              ? 'secondary'
                              : 'default'
                          }
                        >
                          {search.severity_level}
                        </Badge>
                        {search.emergency_triggered && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Emergency
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(search.created_at).toLocaleString()}
                      </CardDescription>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this search?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this health search from your
                            history.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(search.id)} className="bg-destructive">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>

                {search.predicted_diseases && search.predicted_diseases.length > 0 && (
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Predicted Conditions:</h4>
                      <div className="flex flex-wrap gap-2">
                        {search.predicted_diseases.map((disease: string, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {disease}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {search.recommendations && Object.keys(search.recommendations).length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold">Recommendations:</h4>
                        {search.recommendations.diet && (
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="font-medium text-sm mb-1">Diet Plan:</p>
                            <p className="text-sm text-muted-foreground">{search.recommendations.diet}</p>
                          </div>
                        )}
                        {search.recommendations.activities && (
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="font-medium text-sm mb-1">Activities:</p>
                            <p className="text-sm text-muted-foreground">{search.recommendations.activities}</p>
                          </div>
                        )}
                        {search.recommendations.lifestyle && (
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="font-medium text-sm mb-1">Lifestyle Tips:</p>
                            <p className="text-sm text-muted-foreground">{search.recommendations.lifestyle}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
