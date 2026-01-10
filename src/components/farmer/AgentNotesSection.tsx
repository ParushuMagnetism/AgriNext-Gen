import { useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileAudio, 
  Play, 
  Pause, 
  User, 
  Calendar,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface AgentVoiceNote {
  id: string;
  agent_id: string;
  farmer_id: string | null;
  crop_id: string | null;
  task_id: string | null;
  note_text: string | null;
  audio_path: string | null;
  language_code: string;
  created_at: string;
}

const languageLabels: Record<string, string> = {
  'en-IN': 'English',
  'hi-IN': 'Hindi',
  'kn-IN': 'Kannada',
};

const AgentNotesSection = () => {
  const { user } = useAuth();
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: notes, isLoading } = useQuery({
    queryKey: ['agent-notes-for-farmer', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('agent_voice_notes')
        .select('*')
        .eq('farmer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching agent notes:', error);
        return [];
      }

      return data as AgentVoiceNote[];
    },
    enabled: !!user?.id,
  });

  const playAudio = useCallback(async (note: AgentVoiceNote) => {
    if (!note.audio_path) return;

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playingNoteId === note.id) {
      setPlayingNoteId(null);
      return;
    }

    setAudioLoading(note.id);

    try {
      // Get signed URL
      const { data: signedUrl, error } = await supabase.storage
        .from('voice_media')
        .createSignedUrl(note.audio_path, 300);

      if (error || !signedUrl?.signedUrl) {
        throw new Error('Could not get audio URL');
      }

      audioRef.current = new Audio(signedUrl.signedUrl);
      audioRef.current.onended = () => {
        setPlayingNoteId(null);
      };
      audioRef.current.onerror = () => {
        setPlayingNoteId(null);
        console.error('Audio playback error');
      };

      await audioRef.current.play();
      setPlayingNoteId(note.id);
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setAudioLoading(null);
    }
  }, [playingNoteId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileAudio className="h-5 w-5 text-primary" />
            Agent Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileAudio className="h-5 w-5 text-primary" />
            Agent Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No agent notes yet</p>
            <p className="text-xs mt-1">
              Your field agent will leave notes here after visits
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileAudio className="h-5 w-5 text-primary" />
          Agent Notes
          <Badge variant="secondary" className="ml-auto">
            {notes.length} notes
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="p-4 space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Field Agent
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5">
                        {languageLabels[note.language_code] || note.language_code}
                      </Badge>
                    </div>
                    
                    {note.note_text && (
                      <p className="text-sm line-clamp-3">{note.note_text}</p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  </div>

                  {note.audio_path && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => playAudio(note)}
                      disabled={audioLoading === note.id}
                    >
                      {audioLoading === note.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      ) : playingNoteId === note.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AgentNotesSection;
