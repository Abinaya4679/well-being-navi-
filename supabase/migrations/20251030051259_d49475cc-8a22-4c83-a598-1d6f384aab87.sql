-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  age INTEGER,
  gender TEXT,
  height DECIMAL(5,2), -- in cm
  weight DECIMAL(5,2), -- in kg
  medical_history TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create health_searches table for storing user search history
CREATE TABLE IF NOT EXISTS public.health_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symptoms TEXT NOT NULL,
  severity_level TEXT NOT NULL,
  predicted_diseases JSONB,
  recommendations JSONB,
  emergency_triggered BOOLEAN DEFAULT FALSE,
  search_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create disease_recommendations table for storing disease-specific recommendations
CREATE TABLE IF NOT EXISTS public.disease_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_name TEXT NOT NULL UNIQUE,
  diet_plan JSONB NOT NULL,
  activity_recommendations JSONB NOT NULL,
  lifestyle_tips JSONB NOT NULL,
  precautions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for health_searches
CREATE POLICY "Users can view own searches"
  ON public.health_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own searches"
  ON public.health_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own searches"
  ON public.health_searches FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for disease_recommendations (public read)
CREATE POLICY "Everyone can view recommendations"
  ON public.disease_recommendations FOR SELECT
  TO authenticated
  USING (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_disease_recommendations_updated_at
  BEFORE UPDATE ON public.disease_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Insert some initial disease recommendations
INSERT INTO public.disease_recommendations (disease_name, diet_plan, activity_recommendations, lifestyle_tips, precautions) VALUES
('Common Cold', 
 '["Drink plenty of fluids like water, herbal tea, warm lemon water", "Eat vitamin C rich foods - oranges, kiwi, strawberries", "Include garlic and ginger in meals", "Have warm soups and broths", "Consume honey for soothing throat"]',
 '["Get adequate rest (7-9 hours sleep)", "Light stretching or yoga if feeling up to it", "Avoid strenuous exercise until recovered", "Take short walks in fresh air when possible"]',
 '["Stay hydrated throughout the day", "Use a humidifier to ease congestion", "Gargle with warm salt water", "Keep hands clean to prevent spread", "Use tissues and dispose properly"]',
 '["Avoid close contact with others", "Cover mouth when coughing/sneezing", "Wash hands frequently", "Disinfect commonly touched surfaces", "Seek medical help if symptoms worsen after 7 days"]'
),
('Flu (Influenza)', 
 '["Stay well hydrated with water, electrolyte drinks", "Eat easy-to-digest foods like bananas, rice, toast", "Include protein sources for immune support", "Vitamin D rich foods - fatty fish, eggs", "Avoid dairy if it increases mucus"]',
 '["Complete bed rest for 2-3 days", "Avoid all exercise until fever subsides", "Gradually resume light activity after symptoms improve", "Deep breathing exercises to clear lungs"]',
 '["Monitor temperature regularly", "Use fever reducers as needed", "Keep room well-ventilated", "Stay isolated to prevent spread", "Get annual flu vaccination"]',
 '["Seek immediate care if breathing difficulty", "Watch for high fever over 103°F", "Be alert for chest pain or confusion", "Stay home until fever-free for 24 hours", "Antiviral medication most effective within 48 hours"]'
),
('Headache', 
 '["Drink plenty of water throughout day", "Limit caffeine intake", "Eat regular balanced meals", "Include magnesium-rich foods - nuts, seeds, leafy greens", "Avoid foods that trigger your headaches"]',
 '["Practice relaxation techniques - meditation, deep breathing", "Get regular moderate exercise", "Maintain consistent sleep schedule", "Gentle neck and shoulder stretches", "Limit screen time"]',
 '["Identify and avoid triggers", "Manage stress effectively", "Practice good posture", "Take regular breaks from work", "Keep a headache diary"]',
 '["See doctor if headaches are severe or frequent", "Watch for vision changes", "Note if headaches wake you from sleep", "Seek immediate care for sudden severe headache", "Don''t overuse pain medications"]'
);
