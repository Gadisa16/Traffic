// VehicleImageUpload.tsx
import { ImageLightbox } from '@/components/ImageLightbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Image as ImageIcon, Loader2, MoreHorizontal, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface VehicleImage {
    id?: number;
    file_url?: string;
    file?: File;
    preview: string;
    kind?: string;
}

interface VehicleImageUploadProps {
    vehicleId?: string;
    existingImages?: Array<{ id: number; file_url: string; kind?: string }>;
    onImagesChange?: (images: VehicleImage[]) => void;
    onUpload?: (files: File[]) => Promise<void>;
    onDelete?: (imageId: number) => Promise<void>;
    maxImages?: number;
    disabled?: boolean;
}

export function VehicleImageUpload({
    vehicleId,
    existingImages = [],
    onImagesChange,
    onUpload,
    onDelete,
    maxImages = 10,
    disabled = false,
}: Readonly<VehicleImageUploadProps>) {
    const baseUrl = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000';

    const [images, setImages] = useState<VehicleImage[]>(
        existingImages.map(img => {
            console.log('Existing image file_url:', img.file_url);
            console.log('img:', img);
            let preview = '';
            if (img.file_url) {
                if (img.file_url.startsWith('http')) {
                    preview = img.file_url;
                } else {
                    preview = `${baseUrl}${img.file_url}`;
                }
            }
            return {
                id: img.id,
                file_url: img.file_url,
                preview,
                kind: img.kind,
            };
        })
    );
    const [uploading, setUploading] = useState(false);
    const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const VISIBLE_IMAGES = 3; // Show max 3 images in preview

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        if (images.length + files.length > maxImages) {
            toast.error(`Maximum ${maxImages} images allowed`);
            return;
        }

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const invalidFiles = files.filter(f => !validTypes.includes(f.type));
        if (invalidFiles.length > 0) {
            toast.error('Only JPEG, PNG, and WebP images are allowed');
            return;
        }

        const maxSize = 5 * 1024 * 1024;
        const oversizedFiles = files.filter(f => f.size > maxSize);
        if (oversizedFiles.length > 0) {
            toast.error('Each image must be less than 5MB');
            return;
        }

        if (vehicleId && onUpload) {
            setUploading(true);
            try {
                await onUpload(files);
                toast.success(`${files.length} image(s) uploaded successfully`);
            } catch (error) {
                console.error('Upload error:', error);
                toast.error('Failed to upload images');
            } finally {
                setUploading(false);
            }
        } else {
            const newImages: VehicleImage[] = await Promise.all(
                files.map(async (file) => ({
                    file,
                    preview: URL.createObjectURL(file),
                }))
            );

            const updatedImages = [...images, ...newImages];
            setImages(updatedImages);
            onImagesChange?.(updatedImages);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (index: number, imageId?: number) => {
        if (imageId && onDelete) {
            setDeletingIds(prev => new Set(prev).add(imageId));
            try {
                await onDelete(imageId);
                const updatedImages = images.filter((_, i) => i !== index);
                setImages(updatedImages);
                onImagesChange?.(updatedImages);
                toast.success('Image deleted successfully');
            } catch (error) {
                console.error('Delete error:', error);
                toast.error('Failed to delete image');
            } finally {
                setDeletingIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(imageId);
                    return newSet;
                });
            }
        } else {
            const imageToRemove = images[index];
            if (imageToRemove.preview && !imageToRemove.file_url) {
                URL.revokeObjectURL(imageToRemove.preview);
            }
            const updatedImages = images.filter((_, i) => i !== index);
            setImages(updatedImages);
            onImagesChange?.(updatedImages);
        }
    };

    const visibleImages = images.slice(0, VISIBLE_IMAGES);
    const hiddenCount = images.length - VISIBLE_IMAGES;

    return (
        <div className="space-y-4">
            {/* Upload Button */}
            <div className="flex items-center gap-3">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={disabled || uploading || images.length >= maxImages}
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || uploading || images.length >= maxImages}
                    className="flex-shrink-0"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload className="h-4 w-4 mr-2" />
                            {images.length === 0 ? 'Upload Images' : 'Add More'}
                        </>
                    )}
                </Button>
                <p className="text-sm text-muted-foreground flex-shrink-0">
                    {images.length} / {maxImages} images
                </p>
            </div>

            {/* Compact Image Carousel Preview */}
            {images.length > 0 ? (
                <div className="flex items-center gap-2">
                    {/* Visible Images */}
                    {visibleImages.map((image, index) => (
                        <Card 
                            key={image.id || index} 
                            variant="elevated" 
                            className="w-20 h-20 overflow-hidden flex-shrink-0 group relative hover:w-24 hover:h-24 transition-all duration-200"
                        >
                            <CardContent className="p-0 relative cursor-pointer" onClick={() => {
                                setLightboxIndex(index);
                                setLightboxOpen(true);
                            }}>
                                <div className="w-full h-full relative">
                                    <img
                                        src={image.preview}
                                        alt={`Vehicle ${index + 1}`}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/placeholder.svg';
                                        }}
                                    />
                                    {/* Primary Badge */}
                                    {index === 0 && (
                                        <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full shadow-md">
                                            1
                                        </div>
                                    )}
                                </div>
                                
                                {/* Delete Button */}
                                <div className="absolute -top-1 -right-1 bg-destructive/90 hover:bg-destructive text-destructive-foreground p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="h-6 w-6 p-0 m-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(index, image.id);
                                        }}
                                        disabled={image.id ? deletingIds.has(image.id) : false}
                                    >
                                        {image.id && deletingIds.has(image.id) ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <X className="h-3 w-3" />
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Hidden Images Counter */}
                    {hiddenCount > 0 && (
                        <Card 
                            variant="outline" 
                            className="w-20 h-20 flex items-center justify-center flex-shrink-0 bg-muted/50 hover:bg-muted group cursor-pointer transition-all"
                            onClick={() => {
                                setLightboxIndex(VISIBLE_IMAGES);
                                setLightboxOpen(true);
                            }}
                        >
                            <div className="text-center">
                                <MoreHorizontal className="h-6 w-6 text-muted-foreground mx-auto mb-1 group-hover:rotate-90 transition-transform" />
                                <div className="text-xs font-mono text-muted-foreground tracking-wider">
                                    +{hiddenCount}
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            ) : (
                <Card variant="outline" className="border-dashed border-2 h-24">
                    <CardContent className="p-6 text-center h-full flex items-center justify-center">
                        <div>
                            <ImageIcon className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No images</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Instructions */}
            <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium">Click any image</span> to view full size •{' '}
                <span className="font-medium">+#</span> shows additional images •{' '}
                Supported: JPEG, PNG, WebP • Max: 5MB/image
            </p>

            {/* Image Lightbox */}
            <ImageLightbox
                images={images.map((img, idx) => ({
                    id: img.id,
                    preview: img.preview,
                    alt: `Vehicle image ${idx + 1}`,
                }))}
                initialIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
            />
        </div>
    );
}