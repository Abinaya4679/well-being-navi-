import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, ArrowLeft, Bot, User as UserIcon, Phone, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import chatbotIcon from '@/assets/chatbot-icon.jpg';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Chat = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [severityLevel, setSeverityLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [showEmergency, setShowEmergency] = useState(false);
  const [location, setLocation] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('health-analysis', {
        body: {
          messages: [...messages, { role: 'user', content: userMessage }],
          severityLevel,
          userId: user?.id,
        },
      });

      if (error) throw error;

      const assistantMessage = data.response;
      const predictedDiseases = data.diseases || [];
      const recommendations = data.recommendations || {};
      const isEmergency = severityLevel === 'high' || data.emergency;

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantMessage }]);

      if (isEmergency) {
        setShowEmergency(true);
      }

      // Save to database
      await supabase.from('health_searches').insert({
        user_id: user?.id,
        symptoms: userMessage,
        severity_level: severityLevel,
        predicted_diseases: predictedDiseases,
        recommendations,
        emergency_triggered: isEmergency,
        search_location: location || null,
      });

      toast.success('Analysis complete!');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to analyze symptoms');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize, but I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyCall = () => {
    window.location.href = 'tel:108';
  };

  const handleFindHospitals = () => {
    if (location) {
      window.open(`https://www.google.com/maps/search/hospitals+near+${encodeURIComponent(location)}`, '_blank');
    } else {
      toast.error('Please enter your location first');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src={chatbotIcon} alt="AI" className="w-10 h-10 rounded-full" />
            <div>
              <h1 className="text-xl font-bold">AI Health Assistant</h1>
              <p className="text-xs text-muted-foreground">Powered by advanced AI</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Symptom Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <Badge
                  key={level}
                  variant={severityLevel === level ? 'default' : 'outline'}
                  className={`cursor-pointer px-4 py-2 ${
                    severityLevel === level
                      ? level === 'high'
                        ? 'bg-destructive hover:bg-destructive'
                        : level === 'medium'
                        ? 'bg-secondary hover:bg-secondary'
                        : 'bg-primary hover:bg-primary'
                      : ''
                  }`}
                  onClick={() => setSeverityLevel(level)}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {showEmergency && (
          <Card className="mb-4 border-destructive bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Emergency Assistance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">Based on your symptoms, we recommend seeking immediate medical attention.</p>
              <div className="space-y-2">
                <Input
                  placeholder="Enter your location (e.g., Mumbai, India)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-background"
                />
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={handleEmergencyCall} className="flex-1">
                    <Phone className="w-4 h-4 mr-2" />
                    Call 108 Emergency
                  </Button>
                  <Button variant="outline" onClick={handleFindHospitals} className="flex-1">
                    <MapPin className="w-4 h-4 mr-2" />
                    Find Nearby Hospitals
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="h-[500px] flex flex-col">
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <Bot className="w-16 h-16 text-primary opacity-50" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Welcome to AI Health Assistant</h3>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Describe your symptoms, and I'll help analyze them and provide personalized health recommendations.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'gradient-primary text-white'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-muted p-4 rounded-2xl">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          <CardContent className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Describe your symptoms..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
                disabled={loading}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={loading || !input.trim()} className="gradient-primary text-white">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
