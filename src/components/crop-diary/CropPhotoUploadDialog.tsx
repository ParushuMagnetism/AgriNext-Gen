import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, X, Image } from 'lucide-react';
import { useUploadCropMedia } from '@/hooks/useCropDiary';

interface CropPhotoUploadDialogProps {
  cropId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CropPhotoUploadDialog = ({ cropId, open, onOpenChange }: CropPhotoUploadDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [monthTag, setMonthTag] = useState('');

  const uploadMutation = useUploadCropMedia();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const tags: string[] = [];
    if (monthTag) tags.push(monthTag);

    await uploadMutation.mutateAsync({
      cropId,
      file,
      caption: caption || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });

    setFile(null);
    setPreview(null);
    setCaption('');
    setMonthTag('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Upload Crop Photo
          </DialogTitle>
          <DialogDescription>
            Capture or upload a photo of your crop to track its progress.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!preview ? (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <div className="p-4 rounded-full bg-primary/10">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Take Photo or Upload</p>
                  <p className="text-sm text-muted-foreground">
                    Tap to open camera or select from gallery
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2"
                onClick={clearFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div>
            <Label>Caption (Optional)</Label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe what's happening..."
            />
          </div>

          <div>
            <Label>Month Tag (Optional)</Label>
            <Select value={monthTag} onValueChange={setMonthTag}>
              <SelectTrigger>
                <SelectValue placeholder="Select month..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month_1">Month 1</SelectItem>
                <SelectItem value="month_2">Month 2</SelectItem>
                <SelectItem value="month_3">Month 3</SelectItem>
                <SelectItem value="month_4">Month 4</SelectItem>
                <SelectItem value="month_5">Month 5</SelectItem>
                <SelectItem value="month_6">Month 6</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!file || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              'Uploading...'
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CropPhotoUploadDialog;
