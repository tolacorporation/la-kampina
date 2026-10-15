import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCart } from '../../context/CartContext';
import {
  IconZoomIn,
  IconZoomOut,
  IconRotateCcw,
  IconX,
} from '../common/Icons';

export default function ImageZoomModal() {
  const { zoomedImage, setZoomedImage } = useCart();

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [zoomImgLoaded, setZoomImgLoaded] = useState(false);
  const [zoomImgError, setZoomImgError] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const touchDistanceRef = useRef(null);

  // Reset zoom & pan when image changes
  useEffect(() => {
    if (zoomedImage) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      positionRef.current = { x: 0, y: 0 };
      setZoomImgLoaded(false);
      setZoomImgError(false);
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [zoomedImage]);

  // Keep positionRef in sync
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Zoom helpers
  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(3.5, Number((prev + 0.5).toFixed(2))));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(1, Number((prev - 0.5).toFixed(2)));
      if (next === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const toggleZoom = useCallback(() => {
    setScale((prev) => {
      if (prev > 1) {
        setPosition({ x: 0, y: 0 });
        return 1;
      }
      return 2;
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!zoomedImage) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setZoomedImage(null);
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        zoomOut();
      } else if (e.key === '0') {
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedImage, setZoomedImage, zoomIn, zoomOut, resetZoom]);

  // Mouse Wheel Zoom
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(3.5, Number((prev + 0.25).toFixed(2))));
    } else {
      setScale((prev) => {
        const next = Math.max(1, Number((prev - 0.25).toFixed(2)));
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Drag handlers (Mouse)
  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers (Mobile drag & pinch)
  const handleTouchStart = (e) => {
    if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - positionRef.current.x,
        y: e.touches[0].clientY - positionRef.current.y,
      };
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    } else if (e.touches.length === 2 && touchDistanceRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const diff = dist - touchDistanceRef.current;
      if (Math.abs(diff) > 8) {
        setScale((prev) => {
          const delta = diff > 0 ? 0.08 : -0.08;
          const next = Math.min(3.5, Math.max(1, Number((prev + delta).toFixed(2))));
          if (next === 1) setPosition({ x: 0, y: 0 });
          return next;
        });
        touchDistanceRef.current = dist;
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchDistanceRef.current = null;
  };

  if (!zoomedImage) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-2xl flex flex-col justify-between text-white select-none animate-fade-in"
      onClick={() => setZoomedImage(null)}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar: Title & Controls */}
      <div
        className="w-full px-4 sm:px-8 py-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dish Title & Badge */}
        <div className="flex items-center space-x-3 min-w-0 pr-4">
          <h3 className="font-display font-bold text-base sm:text-xl text-stone-100 truncate tracking-wide">
            {zoomedImage.title || zoomedImage.name}
          </h3>
          {zoomedImage.badge && (
            <span className="hidden sm:inline-block bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 text-[10px] sm:text-xs font-black uppercase px-2.5 py-0.5 rounded-full shadow-md font-mono flex-shrink-0">
              {zoomedImage.badge}
            </span>
          )}
        </div>

        {/* Floating Glass Control Pills */}
        <div className="flex items-center space-x-2">
          {/* Zoom controls bar */}
          <div className="flex items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-full p-1 shadow-2xl">
            <button
              onClick={zoomOut}
              disabled={scale <= 1}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                scale <= 1
                  ? 'opacity-30 cursor-not-allowed text-stone-400'
                  : 'hover:bg-white/20 text-stone-200 hover:text-white'
              }`}
              title="Alejar (-)"
              aria-label="Alejar"
            >
              <IconZoomOut className="w-4 h-4" />
            </button>

            <span className="text-[11px] font-mono font-bold px-2 text-amber-300 min-w-[42px] text-center select-none">
              {Math.round(scale * 100)}%
            </span>

            <button
              onClick={zoomIn}
              disabled={scale >= 3.5}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                scale >= 3.5
                  ? 'opacity-30 cursor-not-allowed text-stone-400'
                  : 'hover:bg-white/20 text-stone-200 hover:text-white'
              }`}
              title="Acercar (+)"
              aria-label="Acercar"
            >
              <IconZoomIn className="w-4 h-4" />
            </button>

            {scale > 1 && (
              <button
                onClick={resetZoom}
                className="w-8 h-8 ml-1 rounded-full flex items-center justify-center hover:bg-white/20 text-stone-300 hover:text-white transition"
                title="Restablecer (1x)"
                aria-label="Restablecer tamaño"
              >
                <IconRotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={() => setZoomedImage(null)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-red-500/80 text-stone-200 hover:text-white flex items-center justify-center transition backdrop-blur-xl border border-white/20 shadow-2xl ml-2"
            title="Cerrar (Esc)"
            aria-label="Cerrar visor"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div
        className="flex-1 w-full relative flex items-center justify-center overflow-hidden p-2 sm:p-6"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          className={`relative max-w-full max-h-full transition-transform ${
            isDragging ? 'duration-0' : 'duration-200 ease-out'
          }`}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (scale === 1) {
              toggleZoom();
            }
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            toggleZoom();
          }}
        >
          {!zoomImgError ? (
            <img
              src={zoomedImage.src}
              alt={zoomedImage.alt || zoomedImage.title || 'Plato'}
              decoding="async"
              onLoad={() => setZoomImgLoaded(true)}
              onError={() => setZoomImgError(true)}
              className={`max-h-[72vh] sm:max-h-[78vh] w-auto max-w-[94vw] object-contain rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border border-white/10 pointer-events-none transition-opacity duration-300 ${
                zoomImgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              draggable={false}
            />
          ) : (
            <div className="p-8 text-center bg-stone-900 rounded-3xl border border-white/20 text-stone-300">
              <p className="font-bold text-sm">No se pudo cargar la imagen en alta resolución.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Hint & Info Bar */}
      <div
        className="w-full px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center sm:text-left">
          {zoomedImage.description ? (
            <p className="text-xs text-stone-400 max-w-xl truncate">
              {zoomedImage.description}
            </p>
          ) : (
            <span className="text-xs text-amber-400/90 font-medium tracking-wide">
              La Kampiña • Cochabamba
            </span>
          )}
        </div>

        {/* Helpful micro-interaction tip */}
        <div className="flex items-center space-x-2 text-[11px] text-stone-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md">
          <span className="text-amber-400 font-bold">Tip:</span>
          <span>
            {scale > 1
              ? 'Arrastra para ver detalles • Doble clic para 1x'
              : 'Haz clic en la foto o usa la rueda del ratón para ampliar'}
          </span>
        </div>
      </div>
    </div>
  );
}
