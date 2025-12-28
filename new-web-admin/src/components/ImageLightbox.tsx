// ImageLightbox.tsx
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    ChevronLeft,
    ChevronRight,
    Maximize2,
    RotateCw,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ImageLightboxProps {
    images: Array<{ id?: number; preview: string; alt?: string }>;
    initialIndex?: number;
    isOpen: boolean;
    onClose: () => void;
}

export function ImageLightbox({
    images,
    initialIndex = 0,
    isOpen,
    onClose,
}: ImageLightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset state when opening or changing image
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            setZoom(1);
            setPosition({ x: 0, y: 0 });
            setRotation(0);
        }
    }, [isOpen, initialIndex]);

    const resetView = useCallback(() => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        setRotation(0);
    }, []);

    const goToIndex = useCallback((index: number) => {
        setIsTransitioning(true);
        setCurrentIndex(index);
        resetView();
        setTimeout(() => setIsTransitioning(false), 300);
    }, [resetView]);

    const handlePrevious = useCallback(() => {
        goToIndex(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
    }, [currentIndex, images.length, goToIndex]);

    const handleNext = useCallback(() => {
        goToIndex(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
    }, [currentIndex, images.length, goToIndex]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 6));
    const handleZoomOut = () => {
        setZoom(prev => {
            const newZoom = Math.max(prev - 0.5, 1);
            if (newZoom === 1) resetView();
            return newZoom;
        });
    };

    const handleRotate = () => setRotation(prev => (prev + 90) % 360);

    const handleFitToScreen = () => resetView();

    // Wheel zoom
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        e.deltaY < 0 ? handleZoomIn() : handleZoomOut();
    };

    // Drag handlers
    const startDrag = (clientX: number, clientY: number) => {
        if (zoom <= 1) return;
        setIsDragging(true);
        setDragStart({ x: clientX - position.x, y: clientY - position.y });
    };

    const doDrag = (clientX: number, clientY: number) => {
        if (!isDragging || zoom <= 1) return;
        setPosition({
            x: clientX - dragStart.x,
            y: clientY - dragStart.y,
        });
    };

    const endDrag = () => setIsDragging(false);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKey = (e: KeyboardEvent) => {
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
                    e.preventDefault();
                    handleZoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    handleZoomOut();
                    break;
                case '0':
                    e.preventDefault();
                    handleFitToScreen();
                    break;
                case 'r':
                case 'R':
                    handleRotate();
                    break;
            }
        };

        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose, handlePrevious, handleNext]);

    // Lock scroll when open
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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col pt-0 mt-0"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pointer-events-none">
                <div className="flex items-center gap-3 pointer-events-auto">
                    {/* Zoom & Controls */}
                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                        <Button variant="ghost" size="icon-sm" onClick={handleZoomOut} disabled={zoom <= 1}>
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium text-white min-w-[48px] text-center">
                            {Math.round(zoom * 100)}%
                        </span>
                        <Button variant="ghost" size="icon-sm" onClick={handleZoomIn} disabled={zoom >= 6}>
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-5 bg-white/30 mx-1" />
                        <Button variant="ghost" size="icon-sm" onClick={handleRotate}>
                            <RotateCw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={handleFitToScreen}>
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-4 pointer-events-auto">
                    {/* Image Counter */}
                    {images.length > 1 && (
                        <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                            {currentIndex + 1} / {images.length}
                        </div>
                    )}

                    {/* Close Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={onClose}
                    >
                        <X className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            {/* Main Image Area */}
            <div
                ref={containerRef}
                className="flex-1 flex items-center justify-center relative overflow-hidden"
                onWheel={handleWheel}
                onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
                onMouseMove={(e) => doDrag(e.clientX, e.clientY)}
                onMouseUp={endDrag}
                onMouseLeave={endDrag}
                onTouchStart={(e) => e.touches.length === 1 && startDrag(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchMove={(e) => e.touches.length === 1 && doDrag(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchEnd={endDrag}
            >
                <img
                    ref={imageRef}
                    src={currentImage.preview}
                    alt={currentImage.alt || `Image ${currentIndex + 1}`}
                    className={cn(
                        "select-none object-contain transition-all duration-200",
                        isTransitioning && "opacity-70",
                        zoom > 1 && (isDragging ? "cursor-grabbing" : "cursor-grab")
                    )}
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                        maxWidth: '95vw',
                        maxHeight: '95vh',
                    }}
                    draggable={false}
                    crossOrigin="anonymous"
                    onError={(e) => {
                        console.error('Lightbox image load error:', currentImage.preview);
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                    onLoad={() => {
                        console.log('Lightbox image loaded:', currentImage.preview);
                    }}
                />
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white bg-black/40 hover:bg-black/60 backdrop-blur-sm h-14 w-14 rounded-full"
                        onClick={handlePrevious}
                    >
                        <ChevronLeft className="h-8 w-8" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white bg-black/40 hover:bg-black/60 backdrop-blur-sm h-14 w-14 rounded-full"
                        onClick={handleNext}
                    >
                        <ChevronRight className="h-8 w-8" />
                    </Button>
                </>
            )}

            {/* Thumbnail Strip */}
            {images.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 flex gap-2 max-w-[90vw] overflow-x-auto scrollbar-thin scrollbar-thumb-white/30">
                        {images.map((image, index) => (
                            <button
                                key={index}
                                onClick={() => goToIndex(index)}
                                className={cn(
                                    "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-3 transition-all duration-200",
                                    index === currentIndex
                                        ? "border-white shadow-lg scale-105"
                                        : "border-transparent opacity-50 hover:opacity-90 hover:border-white/40"
                                )}
                            >
                                <img
                                    src={image.preview}
                                    alt={`Thumbnail ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Keyboard Hint (optional - can remove if too much) */}
            <div className="absolute bottom-4 left-4 z-10 text-white/60 text-xs bg-black/40 backdrop-blur px-3 py-2 rounded-lg hidden md:block">
                ←→ Navigate • +/- Zoom • 0 Reset • R Rotate • ESC Close
            </div>
        </div>
    );
}