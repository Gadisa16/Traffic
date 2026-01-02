import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import * as Api from '@/lib/api';
import { Download, Loader2, Printer, QrCode } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface VehicleQRCodeProps {
    readonly vehicleId: string;
    readonly plateNumber: string;
    readonly vehicleMake?: string;
    readonly vehicleModel?: string;
    readonly vehicleYear?: number;
    readonly existingQrValue?: string;
}

export function VehicleQRCode({
    vehicleId,
    plateNumber,
    vehicleMake,
    vehicleModel,
    vehicleYear,
    existingQrValue,
}: VehicleQRCodeProps) {
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '';

    const buildPublicQrUrl = (id: string) => {
        if (!supabaseUrl) return '';
        return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/qr-codes/vehicle-${id}.png`;
    };

    const [qrData, setQrData] = useState<{ qr_value: string; qr_png_url: string; qr_generated_at?: string } | null>(
        existingQrValue ? { qr_value: existingQrValue, qr_png_url: buildPublicQrUrl(vehicleId), qr_generated_at: undefined } : null
    );

    const formatDate = (iso?: string) => {
        if (!iso) return '';
        try {
            return new Date(iso).toLocaleString();
        } catch {
            return iso;
        }
    };
    const [isGenerating, setIsGenerating] = useState(false);
    const [showPrintDialog, setShowPrintDialog] = useState(false);

    const handleGenerateQR = async () => {
        setIsGenerating(true);
        try {
            const result = await Api.generateVehicleQR(vehicleId);
            // Prefer a deterministic public URL for QR codes (public bucket).
            const publicUrl = buildPublicQrUrl(vehicleId) || result.qr_png_url;
            const generatedAt = (result as any).qr_generated_at || new Date().toISOString();
            setQrData({ qr_value: result.qr_value, qr_png_url: publicUrl, qr_generated_at: generatedAt });
            toast.success('QR code generated successfully');
        } catch (error) {
            console.error('QR generation error:', error);
            toast.error('Failed to generate QR code');
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrint = () => {
        setShowPrintDialog(true);
    };

    const handlePrintConfirm = () => {
        globalThis.print();
    };

    const handleDownload = async () => {
        if (!qrData?.qr_png_url) return;

        try {
            const response = await fetch(qrData.qr_png_url);
            const blob = await response.blob();
            const url = globalThis.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vehicle-qr-${plateNumber}.png`;
            document.body.appendChild(a);
            a.click();
            globalThis.URL.revokeObjectURL(url);
            a.remove();
            toast.success('QR code downloaded');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download QR code');
        }
    };

    return (
        <>
            <Card variant="default" className="lg:col-span-3">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                                <QrCode className="h-6 w-6 text-accent" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Vehicle QR Code</h3>
                                <p className="text-sm text-muted-foreground">
                                    {qrData ? 'QR code ready for printing' : 'Generate QR code for field verification'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {qrData ? (
                                <>
                                    <Button variant="outline" size="sm" onClick={handlePrint}>
                                        <Printer className="h-4 w-4 mr-2" />
                                        Print
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleDownload}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </Button>
                                </>
                            ) : (
                                <Button variant="outline" onClick={handleGenerateQR} disabled={isGenerating}>
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <QrCode className="h-4 w-4 mr-2" />
                                            Generate QR
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>

                    {qrData?.qr_png_url && (
                        <div className="mt-6 flex items-center justify-center">
                            <div className="text-center">
                                <img
                                    src={qrData.qr_png_url}
                                    alt="Vehicle QR Code"
                                    className="w-40 h-40 sm:w-64 sm:h-64 mx-auto border-2 border-border rounded-lg"
                                    crossOrigin="anonymous"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        console.error('QR code image load error:', qrData.qr_png_url);
                                        target.style.display = 'none';
                                    }}
                                    onLoad={() => {
                                        console.log('QR code loaded successfully:', qrData.qr_png_url);
                                    }}
                                />
                                <p className="mt-2 text-xs text-muted-foreground font-mono">{qrData.qr_value}</p>
                                {qrData.qr_generated_at && (
                                    <p className="mt-1 text-xs text-muted-foreground">Generated: {formatDate(qrData.qr_generated_at)}</p>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Print Dialog */}
            <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
                <DialogContent className="max-w-4xl max-h-[96vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>Print Vehicle QR Code</DialogTitle>
                    </DialogHeader>
                    <div className="print-content">
                        <PrintableQRCode
                            qrImageUrl={qrData?.qr_png_url || ''}
                            plateNumber={plateNumber}
                            vehicleMake={vehicleMake}
                            vehicleModel={vehicleModel}
                            vehicleYear={vehicleYear}
                            qrValue={qrData?.qr_value || ''}
                            qrGeneratedAt={qrData?.qr_generated_at}
                        />
                    </div>
                    <div className="flex justify-end gap-2 print:hidden">
                        <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handlePrintConfirm}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content,
          .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
        </>
    );
}

interface PrintableQRCodeProps {
    qrImageUrl: string;
    plateNumber: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: number;
    qrValue: string;
}

function PrintableQRCode({
    qrImageUrl,
    plateNumber,
    vehicleMake,
    vehicleModel,
    vehicleYear,
    qrValue,
    qrGeneratedAt,
}: PrintableQRCodeProps & { qrGeneratedAt?: string }) {
    return (
        <div className="bg-white p-6 sm:p-8 rounded-lg border-2 border-gray-300 max-w-[95vw] mx-auto">
            <div className="text-center space-y-4">
                {/* Header */}
                <div className="border-b-2 border-gray-300 pb-4">
                    <h1 className="text-2xl font-bold text-gray-900">Traffic Management System</h1>
                    <p className="text-sm text-gray-600 mt-1">Vehicle Verification QR Code</p>
                </div>

                {/* Vehicle Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{plateNumber}</h2>
                    {!!(vehicleMake || vehicleModel || vehicleYear) && (
                        <p className="text-sm text-gray-700">
                            {vehicleMake} {vehicleModel} {vehicleYear}
                        </p>
                    )}
                </div>

                {/* QR Code */}
                <div className="flex justify-center py-6">
                    <div className="border-4 border-gray-900 p-4 rounded-lg bg-white">
                        <img
                            src={qrImageUrl}
                            alt="Vehicle QR Code"
                            className="w-48 h-48 sm:w-64 sm:h-64 mx-auto"
                            style={{ imageRendering: 'pixelated' }}
                        />
                    </div>
                </div>

                {/* QR Value */}
                <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs font-mono text-gray-600 break-all">{qrValue}</p>
                </div>

                {/* Instructions */}
                <div className="border-t-2 border-gray-300 pt-4 text-left">
                    <h3 className="font-semibold text-sm text-gray-900 mb-2">Scanning Instructions:</h3>
                    <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                        <li>Use the Traffic Inspector mobile app to scan this QR code</li>
                        <li>Ensure good lighting for accurate scanning</li>
                        <li>Keep the QR code clean and undamaged</li>
                        <li>Report any issues to the traffic management office</li>
                    </ul>
                </div>

                {/* Footer */}
                <div className="text-xs text-gray-500 mt-4">
                    {qrGeneratedAt ? (
                        <p>Generated: {new Date(qrGeneratedAt).toLocaleString()}</p>
                    ) : (
                        <p>Generated: —</p>
                    )}
                    <p className="mt-1">For official use only</p>
                </div>
            </div>
        </div>
    );
}
