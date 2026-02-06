import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Camera, FileText, Upload, Loader2, Eye, EyeOff, X } from 'lucide-react';
import { useListingAttachments, useUploadTraceAttachment, useToggleAttachmentVisibility, TraceAttachment } from '@/hooks/useTraceability';
import { supabase } from '@/integrations/supabase/client';

interface EvidenceUploadSectionProps {
  listingId: string;
}

const TAG_LABELS: Record<string, string> = {
  stage_photo: 'Crop Stage Photo',
  input_proof: 'Input/Fertilizer Proof',
  soil_report: 'Soil Report (PDF)',
};

const EvidenceUploadSection = ({ listingId }: EvidenceUploadSectionProps) => {
  const { data: attachments = [], isLoading } = useListingAttachments(listingId);
  const uploadMutation = useUploadTraceAttachment();
  const toggleVisibility = useToggleAttachmentVisibility();
  const [uploadingTag, setUploadingTag] = useState<string | null>(null);

  const handleUpload = async (tag: string, accept: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploadingTag(tag);
      try {
        await uploadMutation.mutateAsync({
          file,
          ownerType: 'listing',
          ownerId: listingId,
          tag,
          visibility: 'private',
        });
      } finally {
        setUploadingTag(null);
      }
    };
    input.click();
  };

  const handleToggle = (att: TraceAttachment) => {
    const newVis = att.visibility === 'public_on_qr' ? 'private' : 'public_on_qr';
    toggleVisibility.mutate({ id: att.id, visibility: newVis });
  };

  const getSignedUrl = (path: string) => {
    const { data } = supabase.storage.from('traceability-media').getPublicUrl(path);
    return data?.publicUrl || '';
  };

  const groupedAttachments = attachments.reduce((acc, att) => {
    if (!acc[att.tag]) acc[att.tag] = [];
    acc[att.tag].push(att);
    return acc;
  }, {} as Record<string, TraceAttachment[]>);

  return (
    <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/20">
      <div className="flex items-center gap-2">
        <Camera className="h-4 w-4 text-primary" />
        <Label className="text-sm font-medium">Evidence Attachments (Optional)</Label>
      </div>
      <p className="text-xs text-muted-foreground">
        Add photos/reports and control which appear on the public QR page
      </p>

      {/* Upload buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={uploadingTag === 'stage_photo'}
          onClick={() => handleUpload('stage_photo', 'image/*')}
        >
          {uploadingTag === 'stage_photo' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          Stage Photo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={uploadingTag === 'input_proof'}
          onClick={() => handleUpload('input_proof', 'image/*')}
        >
          {uploadingTag === 'input_proof' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Input Proof
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={uploadingTag === 'soil_report'}
          onClick={() => handleUpload('soil_report', 'application/pdf,image/*')}
        >
          {uploadingTag === 'soil_report' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Soil Report
        </Button>
      </div>

      {/* Existing attachments */}
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading attachments...</p>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No evidence uploaded yet</p>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center gap-3 p-2 rounded-md bg-background border border-border">
              {att.file_type === 'image' ? (
                <Camera className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{TAG_LABELS[att.tag] || att.tag}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(att.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge
                variant={att.visibility === 'public_on_qr' ? 'default' : 'secondary'}
                className="text-xs cursor-pointer shrink-0"
                onClick={() => handleToggle(att)}
              >
                {att.visibility === 'public_on_qr' ? (
                  <><Eye className="h-3 w-3 mr-1" />On QR</>
                ) : (
                  <><EyeOff className="h-3 w-3 mr-1" />Private</>
                )}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EvidenceUploadSection;
