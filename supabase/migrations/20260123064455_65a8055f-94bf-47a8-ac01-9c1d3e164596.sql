-- Create song_reactions table for emoji reactions
CREATE TABLE public.song_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(song_id, user_id, emoji)
);

-- Create song_comments table for user comments
CREATE TABLE public.song_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.song_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for song_reactions
CREATE POLICY "Anyone can view reactions" ON public.song_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions" ON public.song_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their reactions" ON public.song_reactions FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for song_comments
CREATE POLICY "Anyone can view comments" ON public.song_comments FOR SELECT USING (true);
CREATE POLICY "Users can add comments" ON public.song_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their comments" ON public.song_comments FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.song_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.song_comments;

-- Add indexes for performance
CREATE INDEX idx_song_reactions_song_id ON public.song_reactions(song_id);
CREATE INDEX idx_song_comments_song_id ON public.song_comments(song_id);