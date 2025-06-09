// pages/index.tsx
'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/button';

export default function TemplateSelector() {
  const router = useRouter();

  const selectTemplate = (type: 'speaking' | 'attending') => {
    router.push(`/templates/${type}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-6">
      <h1 className="text-2xl font-bold">Select Your Badge Template</h1>
      <div className="flex gap-4">
        <Button onClick={() => selectTemplate('speaking')}>Speaking Template</Button>
        <Button onClick={() => selectTemplate('attending')}>Attending Template</Button>
      </div>
    </div>
  );
}
