'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/button';

export default function BadgeCreator() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>('/placeholder-avatar.png');
  const [profileImageName, setProfileImageName] = useState('');
  const [name, setName] = useState('Your name and title');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

          const sx = (drawWidth - boxW) / 2 / drawWidth * profile.width;
          const sy = (drawHeight - boxH) / 2 / drawHeight * profile.height;
          const sWidth = profile.width - 2 * sx;
          const sHeight = profile.height - 2 * sy;

          ctx.drawImage(profile, sx, sy, sWidth, sHeight, boxX, boxY, boxW, boxH);

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
  }, []);

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
      />
      <Button onClick={drawCanvas}>Preview</Button>
      <canvas ref={canvasRef} width={1200} height={627} className="mt-4 border" />
      <Button onClick={downloadImage}>Download Image</Button>
    </div>
  );
}
