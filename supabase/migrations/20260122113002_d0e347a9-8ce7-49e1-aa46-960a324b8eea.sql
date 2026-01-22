-- Create artists table
CREATE TABLE public.artists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  genre TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

-- Anyone can view artists
CREATE POLICY "Anyone can view artists" 
ON public.artists 
FOR SELECT 
USING (true);

-- Only admins can manage artists
CREATE POLICY "Admins can manage artists" 
ON public.artists 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
));

-- Add artist_id foreign key to songs table (optional link)
ALTER TABLE public.songs ADD COLUMN artist_id UUID REFERENCES public.artists(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_songs_artist_id ON public.songs(artist_id);

-- Trigger for updated_at
CREATE TRIGGER update_artists_updated_at
BEFORE UPDATE ON public.artists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();