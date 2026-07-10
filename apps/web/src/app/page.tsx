import { UploadEngine } from "@/components/upload-engine";
import { SlideButton } from "@/components/ui/slide-button";

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center py-12 p-4">
      <div className="w-full max-w-4xl relative pb-24">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Secure Vault</h1>
          <p className="text-muted-foreground mt-2">Drag and drop your sensitive assets below.</p>
        </div>
        
        {/* The File Uploader */}
        <div className="bg-card shadow-xl rounded-2xl border border-border p-4">
          <UploadEngine />
        </div>

        {/* The Premium Slide-to-Upload Footer */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-background/80 backdrop-blur-xl shadow-2xl border border-border rounded-full p-2 pr-6 flex items-center gap-4">
            <SlideButton />
            <span className="text-sm font-medium text-muted-foreground pr-2">
              Slide to confirm upload
            </span>
          </div>
        </div>

      </div>
    </main>
  );
}
