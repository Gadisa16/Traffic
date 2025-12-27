import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ImageLightboxProps {
    images: Array<{ id?: number; preview: string; alt?: string }>;
    initialIndex?: number;
    isOpen: boolean;
    onClose: () => void;
}

export function ImageLightbox({ images, initialIndex = 0, isOpen, onClose }: ImageLightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    useEffect(() => {
        if (!isOpen) {
            setZoom(1);
            setPosition({ x: 0, y: 0 });
            setRotation(0);
        }
    }, [isOpen]);

    const handlePrevious = useCallback(() => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        setRotation(0);
    }, [images.length]);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        setRotation(0);
    }, [images.length]);

    const handleZoomIn = () => {
        setZoom((prev) => Math.min(prev + 0.5, 5));
    };

    const handleZoomOut = () => {
        setZoom((prev) => {
            const newZoom = Math.max(prev - 0.5, 1);
            if (newZoom === 1) {
                setPosition({ x: 0, y: 0 });
            }
            return newZoom;
        });
    };

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            handleZoomIn();
        } else {
            handleZoomOut();
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoom > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1 && zoom > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.touches[0].clientX - position.x,
                y: e.touches[0].clientY - position.y,
            });
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging && e.touches.length === 1 && zoom > 1) {
            setPosition({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y,
            });
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowLeft':
                    handlePrevious();
                    break;
                case 'ArrowRight':
                    handleNext();
                    break;
                case '+':
                case '=':
                    handleZoomIn();
                    break;
                case '-':
                case '_':
                    handleZoomOut();
                    break;
                case 'r':
                case 'R':
                    handleRotate();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, handlePrevious, handleNext]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen || images.length === 0) return null;

    const currentImage = images[currentIndex];

    return (
        <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Close Button */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                onClick={onClose}
            >
                <X className="h-6 w-6" />
            </Button>

            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={handleZoomOut}
                    disabled={zoom <= 1}
                >
                    <ZoomOut className="h-5 w-5" />
                </Button>
                <div className="flex items-center justify-center bg-black/50 text-white px-3 rounded-md min-w-[60px]">
                    <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={handleZoomIn}
                    disabled={zoom >= 5}
                >
                    <ZoomIn className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={handleRotate}
                >
                    <RotateCw className="h-5 w-5" />
                </Button>
            </div>

            {/* Image Counter */}
            {images.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 text-white px-4 py-2 rounded-md">
                    <span className="text-sm font-medium">
                        {currentIndex + 1} / {images.length}
                    </span>
                </div>
            )}

            {/* Navigation Buttons */}
            {images.length > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
                        onClick={handlePrevious}
                    >
                        <ChevronLeft className="h-8 w-8" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
                        onClick={handleNext}
                    >
                        <ChevronRight className="h-8 w-8" />
                    </Button>
                </>
            )}

            {/* Main Image Container */}
            <div
                ref={containerRef}
                className="relative w-full h-full flex items-center justify-center overflow-hidden"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <img
                    ref={imageRef}
                    src={currentImage.preview}
                    alt={currentImage.alt || `Image ${currentIndex + 1}`}
                    className={cn(
                        "max-w-[90vw] max-h-[90vh] object-contain transition-transform",
                        zoom > 1 && isDragging ? "cursor-grabbing" : zoom > 1 ? "cursor-grab" : "cursor-default"
                    )}
                    style={{
                        transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px) rotate(${rotation}deg)`,
                        transformOrigin: 'center center',
                    }}
                    draggable={false}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                    }}
                />
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-black/50 p-3 rounded-lg max-w-[90vw] overflow-x-auto">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setCurrentIndex(index);
                                setZoom(1);
                                setPosition({ x: 0, y: 0 });
                                setRotation(0);
                            }}
                            className={cn(
                                "flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all",
                                index === currentIndex
                                    ? "border-white scale-110"
                                    : "border-transparent opacity-60 hover:opacity-100 hover:border-white/50"
                            )}
                        >
                            <img
                                src={image.preview}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/placeholder.svg';
                                }}
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Keyboard Hints */}
            <div className="absolute bottom-4 right-4 z-10 bg-black/50 text-white text-xs px-3 py-2 rounded-md space-y-1">
                <div>ESC: Close</div>
                <div>← →: Navigate</div>
                <div>+/-: Zoom</div>
                <div>R: Rotate</div>
            </div>
        </div>
    );
}
