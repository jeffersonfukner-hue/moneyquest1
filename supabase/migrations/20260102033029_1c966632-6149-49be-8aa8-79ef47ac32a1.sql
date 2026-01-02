-- Create support_tickets table for tracking user support requests
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create support_messages table for ticket conversation threads
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL DEFAULT 'user',
  sender_id UUID,
  content TEXT NOT NULL,
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets
CREATE POLICY "Users can create own tickets" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own tickets" 
ON public.support_tickets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets" 
ON public.support_tickets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tickets" 
ON public.support_tickets 
FOR ALL 
USING (public.is_super_admin(auth.uid()));

-- RLS Policies for support_messages
CREATE POLICY "Users can create messages in own tickets" 
ON public.support_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE id = ticket_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can view messages in own tickets" 
ON public.support_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE id = ticket_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own messages read status" 
ON public.support_messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE id = ticket_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all messages" 
ON public.support_messages 
FOR ALL 
USING (public.is_super_admin(auth.uid()));

-- Create trigger for updated_at on support_tickets
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('support-attachments', 'support-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for support attachments
CREATE POLICY "Users can upload support attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'support-attachments' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own support attachments" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'support-attachments' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can view all support attachments" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'support-attachments' AND 
  public.is_super_admin(auth.uid())
);