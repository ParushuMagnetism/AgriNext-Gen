import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { useUploadProof, useUpdateTripStatusSecure } from '@/hooks/useTrips';

interface ProofCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  type: 'pickup' | 'delivery';
  nextStatus: string;
  onSuccess?: () => void;
}

export default function ProofCaptureDialog({
  open,
  onOpenChange,
  tripId,
  type,
  nextStatus,
  onSuccess,
}: ProofCaptureDialogProps) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [actualWeight, setActualWeight] = useState('');
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadProof = useUploadProof();
  const updateStatus = useUpdateTripStatusSecure();

  const isLoading = uploadProof.isPending || updateStatus.isPending;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 3) {
      return; // Max 3 photos
    }

    const newPhotos = [...photos, ...files].slice(0, 3);
    setPhotos(newPhotos);

    // Create previews
    const newPreviews = newPhotos.map(file => URL.createObjectURL(file));
    previews.forEach(url => URL.revokeObjectURL(url));
    setPreviews(newPreviews);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);

    URL.revokeObjectURL(previews[index]);
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      // Upload all photos first
      const uploadedPaths: string[] = [];
      for (const photo of photos) {
        const path = await uploadProof.mutateAsync({
          tripId,
          file: photo,
          type,
        });
        uploadedPaths.push(path);
      }

      // Update status with proofs
      await updateStatus.mutateAsync({
        tripId,
        newStatus: nextStatus,
        proofPaths: uploadedPaths.length > 0 ? uploadedPaths : undefined,
        note: notes || undefined,
        actualWeightKg: actualWeight ? parseFloat(actualWeight) : undefined,
      });

      // Cleanup
      previews.forEach(url => URL.revokeObjectURL(url));
      setPhotos([]);
      setPreviews([]);
      setActualWeight('');
      setNotes('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error handled by mutations
    }
  };

  const handleClose = () => {
    previews.forEach(url => URL.revokeObjectURL(url));
    setPhotos([]);
    setPreviews([]);
    setActualWeight('');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === 'pickup' ? 'Confirm Pickup' : 'Confirm Delivery'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Photo capture */}
          <div className="space-y-2">
            <Label>Proof Photos (max 3)</Label>
            <div className="grid grid-cols-3 gap-2">
              {previews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                  <img
                    src={preview}
                    alt={`Proof ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Camera className="h-6 w-6 mb-1" />
                  <span className="text-xs">Add</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Actual weight (for pickup) */}
          {type === 'pickup' && (
            <div className="space-y-2">
              <Label htmlFor="weight">Actual Weight (kg) - Optional</Label>
              <Input
                id="weight"
                type="number"
                placeholder="Enter actual weight"
                value={actualWeight}
                onChange={(e) => setActualWeight(e.target.value)}
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {type === 'pickup'
              ? 'Take photos of the loaded goods as proof of pickup.'
              : 'Take photos showing successful delivery.'}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {type === 'pickup' ? 'Confirm Pickup' : 'Confirm Delivery'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
