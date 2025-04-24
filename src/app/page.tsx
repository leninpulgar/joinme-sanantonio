'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/button';

export default function BadgeCreator() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(1200); // Default width
  const [canvasHeight, setCanvasHeight] = useState(627); // Default height
  const [profileImage, setProfileImage] = useState<string | null>('/placeholder-avatar.png');
  const [profileImageName, setProfileImageName] = useState('');
  const [name, setName] = useState('Your name and title');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Handle resizing of avatar image
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);

  // Allow resizing of the image with the mouse
  const isDragging = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });

  const lastDistance = useRef<number | null>(null);

  const getTouchDistance = (e: TouchEvent | React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length < 2) return null;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const preventDefaultTouch = (e: TouchEvent) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  };

  // 🔸 NEW: improved iOS gesture override using document-level event listener
  useEffect(() => {
    const preventGesture = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
  
    // Add event listeners for non-standard gesture events
    document.addEventListener("gesturestart", preventGesture as EventListener, { passive: false });
    document.addEventListener("gesturechange", preventGesture as EventListener, { passive: false });
    document.addEventListener("touchmove", preventGesture as EventListener, { passive: false });
  
    return () => {
      document.removeEventListener("gesturestart", preventGesture as EventListener);
      document.removeEventListener("gesturechange", preventGesture as EventListener);
      document.removeEventListener("touchmove", preventGesture as EventListener);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 🔹 FIX: block default zoom gesture on iOS (Safari & Chrome) reliably
    const opts = { passive: false } as EventListenerOptions;
    canvas.addEventListener('touchstart', preventDefaultTouch, opts);
    canvas.addEventListener('touchmove', preventDefaultTouch, opts);

    return () => {
      canvas.removeEventListener('touchstart', preventDefaultTouch);
      canvas.removeEventListener('touchmove', preventDefaultTouch);
    };
  }, []);

  const startDragging = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    if ('touches' in e) {
      lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastDistance.current = getTouchDistance(e);
    } else {
      lastPosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  const stopDragging = () => {
    isDragging.current = false;
    lastDistance.current = null;
  };

  const onDrag = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;

    if ('touches' in e) {
      if (e.touches.length === 2) {
        const currentDistance = getTouchDistance(e);
        if (lastDistance.current !== null && currentDistance !== null) {
          const delta = currentDistance - lastDistance.current;
          setImageScale((prev) => Math.max(0.1, prev + delta * 0.005));
        }
        lastDistance.current = currentDistance;
        return;
      }
      const point = e.touches[0];
      const deltaX = point.clientX - lastPosition.current.x;
      const deltaY = point.clientY - lastPosition.current.y;
      setImageOffset((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      lastPosition.current = { x: point.clientX, y: point.clientY };
    } else {
      const deltaX = e.clientX - lastPosition.current.x;
      const deltaY = e.clientY - lastPosition.current.y;
      setImageOffset((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      lastPosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  // Allows zoom with wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const scaleAmount = e.deltaY < 0 ? 0.05 : -0.05;
    setImageScale((prev) => Math.max(0.1, prev + scaleAmount));
  };
  


  const handleResize = () => {
    const screenWidth = window.innerWidth;
    const maxWidth = 1200; // Original canvas width
    const aspectRatio = 1200 / 627; // Maintain aspect ratio

    if (screenWidth < maxWidth) {
      setCanvasWidth(screenWidth - 20); // Add some padding
      setCanvasHeight((screenWidth - 20) / aspectRatio);
    } else {
      setCanvasWidth(maxWidth);
      setCanvasHeight(maxWidth / aspectRatio);
    }
  };

  useEffect(() => {
    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize); // Update on resize
    return () => window.removeEventListener('resize', handleResize); // Cleanup
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setProfileImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset the transformation matrix to prevent cumulative scaling
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Scale the canvas drawing to match the new dimensions
    // ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings
    ctx.scale(canvas.width / 1200, canvas.height / 627);

    const background = new Image();
    background.src = '/joinme_attending.jpg';
    background.onload = () => {
      ctx.drawImage(background, 0, 0, 1200, 627);

      if (profileImage) {
        const profile = new Image();
        profile.src = profileImage;
        profile.onload = () => {
          // Strict bounding box enforcement
          const boxX = 810;
          const boxY = 155;
          const boxW = 318;
          const boxH = 365;

          const imgRatio = profile.width / profile.height;
          const boxRatio = boxW / boxH;

          let drawWidth = boxW;
          let drawHeight = boxH;

          if (imgRatio > boxRatio) {
            drawHeight = boxH;
            drawWidth = boxH * imgRatio;
          } else {
            drawWidth = boxW;
            drawHeight = boxW / imgRatio;
          }

          // const sx = (drawWidth - boxW) / 2 / drawWidth * profile.width;
          // const sy = (drawHeight - boxH) / 2 / drawHeight * profile.height;
          // const sWidth = profile.width - 2 * sx;
          // const sHeight = profile.height - 2 * sy;

          // Draw the image
          // ctx.drawImage(profile, sx, sy, sWidth, sHeight, boxX, boxY, boxW, boxH);
          const scaledW = drawWidth * imageScale;
          const scaledH = drawHeight * imageScale;
          const dx = boxX + imageOffset.x + (boxW - scaledW) / 2;
          const dy = boxY + imageOffset.y + (boxH - scaledH) / 2;

          // ctx.drawImage(profile, sx, sy, sWidth, sHeight, dx, dy, scaledW, scaledH);
          ctx.save();
          ctx.beginPath();
          ctx.rect(boxX, boxY, boxW, boxH);
          ctx.clip();
          ctx.drawImage(profile, 0, 0, profile.width, profile.height, dx, dy, scaledW, scaledH);
          ctx.restore(); // termina el clipping

          // Luego puedes continuar con el texto sin problemas
          ctx.font = '20px sans-serif';
          ctx.fillStyle = 'white';

          // Wrap name if too long
          const maxWidth = 318;
          const lines = [];
          let currentLine = '';
          const words = name.split(' ');

          for (const word of words) {
            const testLine = currentLine + word + ' ';
            const { width } = ctx.measureText(testLine);
            if (width > maxWidth && currentLine !== '') {
              lines.push(currentLine);
              currentLine = word + ' ';
            } else {
              currentLine = testLine;
            }
          }
          lines.push(currentLine);

          lines.forEach((line, i) => {
            ctx.fillText(line.trim(), 810, 550 + i * 24);
          });
        };
      }
    };
  };

  useEffect(() => {
    drawCanvas();
  }, [canvasWidth, canvasHeight, profileImage, name, imageOffset, imageScale]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'badge.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="flex items-center gap-2 max-w-xs w-full">
        <Button className="whitespace-nowrap" onClick={() => fileInputRef.current?.click()}>Upload Image</Button>
        <input
          type="text"
          value={profileImageName}
          readOnly
          placeholder="No file selected"
          className="flex-1 border p-2 rounded text-sm text-gray-600 bg-gray-100"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          ref={fileInputRef}
          className="hidden"
        />
      </div>
      <input
        type="text"
        placeholder="Your Name and Title"
        className="border p-2 rounded"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onFocus={(e) => e.target.select()}
      />
      <Button onClick={drawCanvas}>Preview</Button>
      <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="mt-4 border"
      style={{ width: canvasWidth, height: canvasHeight, cursor: 'grab' }}
      onMouseDown={startDragging}
      onMouseMove={onDrag}
      onMouseUp={stopDragging}
      onMouseLeave={stopDragging}
      onWheel={handleWheel}
    />
      <Button onClick={downloadImage}>Download Image</Button>
    </div>
  );
}
