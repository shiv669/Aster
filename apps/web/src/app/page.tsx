import { UploadEngine } from "@/components/upload-engine";
import { SlideButton } from "@/components/ui/slide-button";

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center py-12 p-4">
      <div className="w-full max-w-4xl relative pb-24">
        {/* The File Uploader */}
        <div className="bg-card shadow-xl rounded-2xl border border-border p-4">
          <UploadEngine />
        </div>

      </div>
    </main>
  );
}
