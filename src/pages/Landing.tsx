import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, Heart, Shield, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImage from '@/assets/hero-medical.jpg';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 gradient-hero opacity-90 z-0" />
        
        <div className="container mx-auto px-4 z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 py-20">
            <div className="inline-block">
              <div className="bg-white/10 backdrop-blur-md rounded-full px-6 py-3 mb-8 inline-flex items-center gap-2 shadow-elegant">
                <Heart className="w-5 h-5 text-white animate-pulse" />
                <span className="text-white font-medium">Your AI Health Companion</span>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight animate-fade-in">
              Intelligent Health
              <span className="block gradient-secondary bg-clip-text text-transparent">
                Guidance at Your Fingertips
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              Get personalized symptom analysis, disease predictions, and health recommendations powered by advanced AI
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link to="/auth">
                <Button size="lg" className="gradient-primary text-white border-0 shadow-elegant hover:scale-105 transition-all">
                  Get Started <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-md text-white border-white/30 hover:bg-white/20">
                Learn More
              </Button>
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute bottom-10 left-10 w-20 h-20 bg-white/10 backdrop-blur-md rounded-full animate-float shadow-primary" />
        <div className="absolute top-20 right-20 w-16 h-16 bg-white/10 backdrop-blur-md rounded-full animate-float animation-delay-2s shadow-secondary" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Why Choose Medi Portal?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Advanced AI technology meets compassionate healthcare guidance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Bot,
                title: 'AI-Powered Analysis',
                description: 'Advanced machine learning for accurate symptom assessment',
              },
              {
                icon: Heart,
                title: 'Personalized Care',
                description: 'Recommendations tailored to your health profile',
              },
              {
                icon: Shield,
                title: 'Secure & Private',
                description: 'Your health data is encrypted and protected',
              },
              {
                icon: Clock,
                title: '24/7 Availability',
                description: 'Access health guidance anytime, anywhere',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group bg-card rounded-2xl p-8 shadow-lg hover:shadow-elegant transition-all duration-300 hover:-translate-y-2"
              >
                <div className="w-16 h-16 gradient-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Take Control of Your Health?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of users who trust Medi Portal for their health guidance
            </p>
            <Link to="/auth">
              <Button size="lg" className="gradient-primary text-white border-0 shadow-elegant hover:scale-105 transition-all">
                Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
