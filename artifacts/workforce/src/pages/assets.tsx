import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useGetAssets, getGetAssetsQueryKey } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Laptop, Smartphone, Monitor } from 'lucide-react';
import { format } from 'date-fns';

export default function Assets() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const { data: assetsData, isLoading } = useGetAssets(
    { companyId: user?.companyId || 0 },
    { query: { enabled: !!user?.companyId, queryKey: getGetAssetsQueryKey({ companyId: user?.companyId || 0 }) } }
  );

  const getAssetIcon = (type?: string) => {
    switch(type?.toLowerCase()) {
      case 'laptop': return <Laptop className="h-5 w-5" />;
      case 'phone': return <Smartphone className="h-5 w-5" />;
      case 'monitor': return <Monitor className="h-5 w-5" />;
      default: return <Laptop className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{t('assets')}</h1>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Asset
        </Button>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="text-sm opacity-80 mb-1">Total Assets</div>
            <div className="text-3xl font-bold">1,248</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="text-sm text-muted-foreground mb-1">Assigned</div>
            <div className="text-3xl font-bold">982</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="text-sm text-muted-foreground mb-1">Available</div>
            <div className="text-3xl font-bold">215</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="text-sm text-muted-foreground mb-1">Maintenance</div>
            <div className="text-3xl font-bold text-amber-500">51</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Asset</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : assetsData?.assets?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No assets found</TableCell>
                </TableRow>
              ) : (
                assetsData?.assets?.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          {getAssetIcon(asset.type || '')}
                        </div>
                        <div>
                          <div className="font-medium">{asset.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">{asset.type}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{asset.serialNumber}</TableCell>
                    <TableCell>{asset.assignedToName || <span className="text-muted-foreground italic">Unassigned</span>}</TableCell>
                    <TableCell>{asset.purchaseDate ? format(new Date(asset.purchaseDate), 'MMM d, yyyy') : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={
                        asset.status === 'assigned' ? 'default' :
                        asset.status === 'available' ? 'success' :
                        asset.status === 'maintenance' ? 'warning' : 'secondary'
                      } className="capitalize">
                        {asset.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}