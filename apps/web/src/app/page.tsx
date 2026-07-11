import { UploadEngine } from "@/components/upload-engine";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center py-12 p-4 relative transition-colors duration-300">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-4xl relative pb-24">
        {/* The File Uploader */}
        <div className="bg-card shadow-xl rounded-2xl border border-border p-4">
          <UploadEngine />
        </div>

      </div>
    </main>
  );
}
