 import { useState, useEffect } from 'react';
 import { useParams, Link } from 'react-router-dom';
 import { supabase } from '@/integrations/supabase/client';
 import { Badge } from '@/components/ui/badge';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Separator } from '@/components/ui/separator';
 import { 
   ShieldCheck, 
   MapPin, 
   Package, 
   Calendar, 
   FileText,
   ExternalLink,
   Loader2,
   AlertCircle,
   Leaf
 } from 'lucide-react';
 import { format } from 'date-fns';
 
 interface TraceData {
   trace_code: string;
   product_name: string;
   category: string;
   quantity: number;
   unit: string;
   price: number;
   origin: string | null;
   inputs_summary: string | null;
   test_report_urls: string[];
   listed_at: string;
   verified: boolean;
   platform: string;
 }
 
 const ListingTrace = () => {
   const { traceCode } = useParams<{ traceCode: string }>();
   const [traceData, setTraceData] = useState<TraceData | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   useEffect(() => {
     const fetchTraceData = async () => {
       if (!traceCode) {
         setError('Invalid trace code');
         setLoading(false);
         return;
       }
 
       try {
         const { data, error: fnError } = await supabase.functions.invoke('public-listing-trace', {
           body: null,
           headers: {},
         });
 
         // Use fetch directly for GET request with query params
         const response = await fetch(
           `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-listing-trace?trace_code=${encodeURIComponent(traceCode)}`,
           {
             method: 'GET',
             headers: {
               'Content-Type': 'application/json',
             },
           }
         );
 
         const result = await response.json();
 
         if (!response.ok) {
           setError(result.message || 'This trace record is not available.');
           setTraceData(null);
         } else {
           setTraceData(result);
           setError(null);
         }
       } catch (err) {
         console.error('Error fetching trace data:', err);
         setError('Unable to verify this product. Please try again later.');
       } finally {
         setLoading(false);
       }
     };
 
     fetchTraceData();
   }, [traceCode]);
 
   if (loading) {
     return (
       <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
         <div className="text-center">
           <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
           <p className="text-muted-foreground">Verifying product origin...</p>
         </div>
       </div>
     );
   }
 
   if (error || !traceData) {
     return (
       <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
         <Card className="max-w-md w-full">
           <CardContent className="pt-6 text-center">
             <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
             <h2 className="text-xl font-semibold text-foreground mb-2">
               Trace Record Not Available
             </h2>
             <p className="text-muted-foreground mb-4">
               {error || 'This product trace record is not available or has been unpublished.'}
             </p>
             <Link 
               to="/" 
               className="text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-1"
             >
               Visit AgriNext Gen <ExternalLink className="h-4 w-4" />
             </Link>
           </CardContent>
         </Card>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4">
       <div className="max-w-lg mx-auto">
         {/* Header with verification badge */}
         <div className="text-center mb-6">
           <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-4">
             <ShieldCheck className="h-5 w-5" />
             <span className="font-medium">Verified Product</span>
           </div>
           <h1 className="text-2xl font-bold text-foreground">
             Product Transparency
           </h1>
           <p className="text-muted-foreground text-sm mt-1">
             Trace Code: {traceData.trace_code}
           </p>
         </div>
 
         {/* Main product card */}
         <Card className="mb-4 overflow-hidden">
           <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 text-white">
             <div className="flex items-start gap-4">
               <div className="bg-white/20 rounded-lg p-3">
                 <Leaf className="h-8 w-8" />
               </div>
               <div>
                 <h2 className="text-xl font-bold">{traceData.product_name}</h2>
                 <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-0">
                   {traceData.category}
                 </Badge>
               </div>
             </div>
           </div>
 
           <CardContent className="pt-6 space-y-4">
             {/* Origin */}
             {traceData.origin && (
               <div className="flex items-start gap-3">
                 <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                 <div>
                   <p className="text-sm text-muted-foreground">Origin</p>
                   <p className="font-medium">{traceData.origin}</p>
                 </div>
               </div>
             )}
 
             {/* Quantity */}
             <div className="flex items-start gap-3">
               <Package className="h-5 w-5 text-green-600 mt-0.5" />
               <div>
                 <p className="text-sm text-muted-foreground">Quantity Available</p>
                 <p className="font-medium">{traceData.quantity} {traceData.unit}</p>
               </div>
             </div>
 
             {/* Listed Date */}
             <div className="flex items-start gap-3">
               <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
               <div>
                 <p className="text-sm text-muted-foreground">Listed On</p>
                 <p className="font-medium">
                   {format(new Date(traceData.listed_at), 'PPP')}
                 </p>
               </div>
             </div>
 
             {/* Inputs Summary */}
             {traceData.inputs_summary && (
               <>
                 <Separator />
                 <div>
                   <p className="text-sm text-muted-foreground mb-2">Farming Inputs Used</p>
                   <p className="text-sm bg-muted/50 p-3 rounded-lg">
                     {traceData.inputs_summary}
                   </p>
                 </div>
               </>
             )}
 
             {/* Test Reports */}
             {traceData.test_report_urls && traceData.test_report_urls.length > 0 && (
               <>
                 <Separator />
                 <div>
                   <p className="text-sm text-muted-foreground mb-2">Test Reports</p>
                   <div className="space-y-2">
                     {traceData.test_report_urls.map((url, index) => (
                       <a
                         key={index}
                         href={url}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm"
                       >
                         <FileText className="h-4 w-4" />
                         View Report {index + 1}
                         <ExternalLink className="h-3 w-3" />
                       </a>
                     ))}
                   </div>
                 </div>
               </>
             )}
           </CardContent>
         </Card>
 
         {/* Verification footer */}
         <Card className="bg-green-50 border-green-200">
           <CardContent className="py-4">
             <div className="flex items-center justify-center gap-2 text-green-800">
               <ShieldCheck className="h-5 w-5" />
               <span className="text-sm font-medium">
                 Verified on {traceData.platform}
               </span>
             </div>
             <p className="text-xs text-center text-green-700 mt-2">
               This product listing has been verified for authenticity
             </p>
           </CardContent>
         </Card>
 
         {/* Back to main site */}
         <div className="text-center mt-6">
           <Link 
             to="/" 
             className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1"
           >
             Learn more about AgriNext Gen <ExternalLink className="h-3 w-3" />
           </Link>
         </div>
       </div>
     </div>
   );
 };
 
 export default ListingTrace;