-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create songs table
CREATE TABLE public.songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  genre TEXT,
  mood TEXT,
  duration INTEGER DEFAULT 0,
  bpm INTEGER,
  cover_url TEXT,
  audio_url TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  play_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create albums table
CREATE TABLE public.albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  cover_url TEXT,
  release_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlists table
CREATE TABLE public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlist_songs junction table
CREATE TABLE public.playlist_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, song_id)
);

-- Create user_library table for liked songs
CREATE TABLE public.user_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, song_id)
);

-- Create recently_played table
CREATE TABLE public.recently_played (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recently_played ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Songs policies (visible songs readable by all authenticated users)
CREATE POLICY "Anyone can view visible songs" ON public.songs FOR SELECT USING (is_visible = true);
CREATE POLICY "Admins can do everything with songs" ON public.songs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- Albums policies
CREATE POLICY "Anyone can view albums" ON public.albums FOR SELECT USING (true);
CREATE POLICY "Admins can manage albums" ON public.albums FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- Playlists policies
CREATE POLICY "Anyone can view public playlists" ON public.playlists FOR SELECT USING (is_public = true OR user_id = auth.uid());
CREATE POLICY "Users can create their own playlists" ON public.playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own playlists" ON public.playlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own playlists" ON public.playlists FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all playlists" ON public.playlists FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- Playlist songs policies
CREATE POLICY "Anyone can view playlist songs for viewable playlists" ON public.playlist_songs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND (is_public = true OR user_id = auth.uid()))
);
CREATE POLICY "Users can manage their playlist songs" ON public.playlist_songs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND user_id = auth.uid())
);

-- User library policies
CREATE POLICY "Users can view their own library" ON public.user_library FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to their library" ON public.user_library FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from their library" ON public.user_library FOR DELETE USING (auth.uid() = user_id);

-- Recently played policies
CREATE POLICY "Users can view their own history" ON public.recently_played FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to their history" ON public.recently_played FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, is_admin)
  VALUES (
    NEW.id, 
    NEW.email,
    CASE WHEN NEW.email = 'shashankyadavk12@gmail.com' THEN true ELSE false END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON public.songs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON public.playlists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for songs table
ALTER PUBLICATION supabase_realtime ADD TABLE public.songs;