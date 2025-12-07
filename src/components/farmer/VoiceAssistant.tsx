import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Bot, 
  User, 
  Loader2,
  Languages,
  MessageSquare,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type SupportedLanguage = 'en-IN' | 'hi-IN' | 'kn-IN';

const languageLabels: Record<SupportedLanguage, string> = {
  'en-IN': 'English',
  'hi-IN': 'हिंदी',
  'kn-IN': 'ಕನ್ನಡ',
};

const VoiceAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en-IN');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (typeof window !== 'undefined' && SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = selectedLanguage;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        // Auto-send after voice input
        handleSendMessage(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please enable it in your browser settings.');
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      window.speechSynthesis?.cancel();
    };
  }, [selectedLanguage]);

  // Update recognition language when changed
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = selectedLanguage;
    }
  }, [selectedLanguage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startListening = async () => {
    if (!recognitionRef.current) {
      toast.error('Voice input is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognitionRef.current.lang = selectedLanguage;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Microphone error:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const speakText = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLanguage;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Find a suitable voice
    const voices = window.speechSynthesis.getVoices();
    const langCode = selectedLanguage.split('-')[0];
    const voice = voices.find(v => v.lang.startsWith(langCode)) || voices[0];
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('farmer-assistant', {
        body: { 
          message: messageText,
          language: selectedLanguage
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Speak the response if voice is enabled
      if (voiceEnabled) {
        speakText(data.reply);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Could not get a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const cycleLanguage = () => {
    const languages: SupportedLanguage[] = ['en-IN', 'hi-IN', 'kn-IN'];
    const currentIndex = languages.indexOf(selectedLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    setSelectedLanguage(languages[nextIndex]);
    toast.success(`Language: ${languageLabels[languages[nextIndex]]}`);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[360px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-6rem)] shadow-xl z-50 flex flex-col">
      <CardHeader className="pb-3 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Krishi Mitra</CardTitle>
              <p className="text-xs text-muted-foreground">Your Farming Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={cycleLanguage}
              title="Change language"
            >
              <Languages className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              title={voiceEnabled ? "Disable voice" : "Enable voice"}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Badge variant="secondary" className="w-fit text-xs">
          {languageLabels[selectedLanguage]}
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <Bot className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="font-medium text-sm mb-1">Namaste! 🙏</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Ask me about crops, weather, market prices, or any farming questions.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-accent text-xs"
                  onClick={() => handleSendMessage("What crops should I plant this season?")}
                >
                  Season crops
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-accent text-xs"
                  onClick={() => handleSendMessage("मेरी फसल में कीड़े लग गए हैं, क्या करूं?")}
                >
                  कीट नियंत्रण
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-accent text-xs"
                  onClick={() => handleSendMessage("ಬೆಳೆಗಳಿಗೆ ನೀರು ಹೇಗೆ ನೀಡಬೇಕು?")}
                >
                  ನೀರಾವರಿ
                </Badge>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="px-4 py-2 bg-primary/5 border-t flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-primary">
              <Volume2 className="h-4 w-4 animate-pulse" />
              Speaking...
            </div>
            <Button variant="ghost" size="sm" onClick={stopSpeaking} className="h-7 text-xs">
              Stop
            </Button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 border-t flex-shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant={isListening ? "destructive" : "outline"}
              size="icon"
              className="h-10 w-10 flex-shrink-0"
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? "Listening..." : "Type or speak..."}
              className="flex-1"
              disabled={isListening || isLoading}
            />
            <Button
              size="icon"
              className="h-10 w-10 flex-shrink-0"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {isListening && (
            <p className="text-xs text-center text-muted-foreground mt-2 animate-pulse">
              🎤 Speak now in {languageLabels[selectedLanguage]}...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceAssistant;
