import { ImageLightbox } from '@/components/ImageLightbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
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
    const [images, setImages] = useState<VehicleImage[]>(
        existingImages.map(img => ({
            id: img.id,
            file_url: img.file_url,
            preview: img.file_url,
            kind: img.kind,
        }))
    );
    const [uploading, setUploading] = useState(false);
    const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        // Check max images limit
        if (images.length + files.length > maxImages) {
            toast.error(`Maximum ${maxImages} images allowed`);
            return;
        }

        // Validate file types
        const validTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
        const invalidFiles = files.filter(f => !validTypes.has(f.type));
        if (invalidFiles.length > 0) {
            toast.error('Only JPEG, PNG, and WebP images are allowed');
            return;
        }

        // Validate file sizes (max 5MB per file)
        const maxSize = 5 * 1024 * 1024;
        const oversizedFiles = files.filter(f => f.size > maxSize);
        if (oversizedFiles.length > 0) {
            toast.error('Each image must be less than 5MB');
            return;
        }

        // If vehicleId exists and onUpload is provided, upload immediately
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
            // Otherwise, just preview locally for new vehicle creation
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

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (index: number, imageId?: number) => {
        if (imageId && onDelete) {
            // Delete from server
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
            // Remove from local preview
            const imageToRemove = images[index];
            if (imageToRemove.preview && !imageToRemove.file_url) {
                URL.revokeObjectURL(imageToRemove.preview);
            }
            const updatedImages = images.filter((_, i) => i !== index);
            setImages(updatedImages);
            onImagesChange?.(updatedImages);
        }
    };

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
                >
                    {uploading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Images
                        </>
                    )}
                </Button>
                <p className="text-sm text-muted-foreground">
                    {images.length} / {maxImages} images
                </p>
            </div>

            {/* Image Grid */}
            {images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                        <Card key={index*2} variant="default" className="overflow-hidden">
                            <CardContent className="p-0 relative group">
                                <div
                                    className="aspect-square relative bg-muted cursor-pointer"
                                    onClick={() => {
                                        setLightboxIndex(index);
                                        setLightboxOpen(true);
                                    }}
                                >
                                    <img
                                        src={image.preview}
                                        alt={`Vehicle ${index + 1}`}
                                        className="w-full h-full object-cover transition-transform hover:scale-105"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/placeholder.svg';
                                        }}
                                    />
                                    {/* Delete Button Overlay */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(index, image.id);
                                            }}
                                            disabled={image.id ? deletingIds.has(image.id) : false}
                                        >
                                            {image.id && deletingIds.has(image.id) ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <X className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    {/* Primary Badge */}
                                    {index === 0 && (
                                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                            Primary
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card variant="default" className="border-dashed">
                    <CardContent className="p-8 text-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground mb-2">No images uploaded</p>
                        <p className="text-xs text-muted-foreground">
                            Click "Upload Images" to add vehicle photos
                        </p>
                    </CardContent>
                </Card>
            )}

            <p className="text-xs text-muted-foreground">
                Supported formats: JPEG, PNG, WebP • Max size: 5MB per image • Click image to view full size
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
