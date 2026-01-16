import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { Farmland } from '@/hooks/useFarmerDashboard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EditFarmlandDialogProps {
  farmland: Farmland | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditFarmlandDialog = ({ farmland, open, onOpenChange }: EditFarmlandDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    area: '',
    area_unit: 'acres',
    soil_type: '',
    village: '',
    district: '',
  });

  useEffect(() => {
    if (farmland) {
      setFormData({
        name: farmland.name,
        area: farmland.area.toString(),
        area_unit: farmland.area_unit,
        soil_type: farmland.soil_type || '',
        village: farmland.village || '',
        district: farmland.district || '',
      });
    }
  }, [farmland]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !farmland) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('farmlands')
        .update({
          name: formData.name,
          area: parseFloat(formData.area),
          area_unit: formData.area_unit,
          soil_type: formData.soil_type || null,
          village: formData.village || null,
          district: formData.district || null,
        })
        .eq('id', farmland.id);

      if (error) throw error;

      toast({ title: t('farmer.farmlands.updateSuccess') });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['farmlands', user.id] });
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('farmer.farmlands.editFarmland')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t('farmer.farmlands.plotName')} *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('farmer.farmlands.plotNamePlaceholder')}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('farmer.farmlands.area')} *</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="5"
                required
              />
            </div>
            <div>
              <Label>{t('common.unit')}</Label>
              <Select value={formData.area_unit} onValueChange={(v) => setFormData({ ...formData, area_unit: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acres">{t('enum.area_units.acres')}</SelectItem>
                  <SelectItem value="hectares">{t('enum.area_units.hectares')}</SelectItem>
                  <SelectItem value="bigha">{t('enum.area_units.bigha')}</SelectItem>
                  <SelectItem value="guntha">{t('enum.area_units.guntha')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>{t('farmer.farmlands.soilType')}</Label>
            <Select value={formData.soil_type} onValueChange={(v) => setFormData({ ...formData, soil_type: v })}>
              <SelectTrigger>
                <SelectValue placeholder={t('farmer.farmlands.selectSoilType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alluvial">{t('enum.soil_types.alluvial')}</SelectItem>
                <SelectItem value="black">{t('enum.soil_types.black')}</SelectItem>
                <SelectItem value="red">{t('enum.soil_types.red')}</SelectItem>
                <SelectItem value="laterite">{t('enum.soil_types.laterite')}</SelectItem>
                <SelectItem value="sandy">{t('enum.soil_types.sandy')}</SelectItem>
                <SelectItem value="clay">{t('enum.soil_types.clay')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('farmer.farmlands.village')}</Label>
              <Input
                value={formData.village}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                placeholder={t('farmer.farmlands.villagePlaceholder')}
              />
            </div>
            <div>
              <Label>{t('farmer.farmlands.district')}</Label>
              <Input
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder={t('farmer.farmlands.districtPlaceholder')}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              t('common.saveChanges')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFarmlandDialog;
