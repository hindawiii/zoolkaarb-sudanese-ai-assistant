import { lazy, Suspense } from "react";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import PageMetadata from "@/components/PageMetadata";
import { Loader2 } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
const Index = lazy(() => import("./pages/Index.tsx"));
const AiChat = lazy(() => import("./pages/AiChat.tsx"));
const Studio = lazy(() => import("./pages/Studio.tsx"));
const StudioToolPage = lazy(() => import("./pages/StudioToolPage.tsx"));
const StudioQuickEdit = lazy(() => import("./pages/StudioQuickEdit.tsx"));
const AnimeStudio = lazy(() => import("./pages/AnimeStudio.tsx"));
const OutfitterStudio = lazy(() => import("./pages/OutfitterStudio.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const AlWajib = lazy(() => import("./pages/AlWajib.tsx"));
const TemplateEditor = lazy(() => import("./pages/TemplateEditor.tsx"));
const DataSaver = lazy(() => import("./pages/DataSaver.tsx"));
const ZoolShare = lazy(() => import("./pages/ZoolShare.tsx"));
const Scanner = lazy(() => import("./pages/Scanner.tsx"));
const ZoolYafatish = lazy(() => import("./pages/ZoolYafatish.tsx"));
const VoiceChanger = lazy(() => import("./pages/VoiceChanger.tsx"));
const AudioStudio = lazy(() => import("./pages/AudioStudio.tsx"));
const MediaFactory = lazy(() => import("./pages/audio/MediaFactory.tsx"));
const VoiceOver = lazy(() => import("./pages/audio/VoiceOver.tsx"));

const FakeCall = lazy(() => import("./pages/FakeCall.tsx"));
const FakeCallIncoming = lazy(() => import("./pages/FakeCallIncoming.tsx"));
const Office = lazy(() => import("./pages/office/Office.tsx"));
const ToPdf = lazy(() => import("./pages/office/ToPdf.tsx"));
const Converter = lazy(() => import("./pages/office/Converter.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
import VoiceNotesFAB from "./components/VoiceNotesFAB.tsx";
import DailyChestModal from "./components/DailyChestModal.tsx";
import ReminderAlert from "./components/ReminderAlert.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PageMetadata />
        <AppErrorBoundary>
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-label="Loading"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/index" element={<Navigate to="/" replace />} />
          <Route path="/chat" element={<AiChat />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/studio/quick" element={<StudioQuickEdit />} />
          <Route path="/studio/anime-hero" element={<AnimeStudio />} />
          <Route path="/studio/clothes-changer" element={<OutfitterStudio />} />
          <Route path="/studio/:slug" element={<StudioToolPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/al-wajib" element={<AlWajib />} />
          <Route path="/al-wajib/editor/:id" element={<TemplateEditor />} />
          <Route path="/data-saver" element={<DataSaver />} />
          <Route path="/zool-share" element={<ZoolShare />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/yafatish" element={<ZoolYafatish />} />
          <Route path="/voice-changer" element={<VoiceChanger />} />
          <Route path="/audio-studio" element={<AudioStudio />} />
          <Route path="/audio-studio/media-factory" element={<MediaFactory />} />
          <Route path="/audio-studio/voice-over" element={<VoiceOver />} />
          <Route path="/audio-studio/remix" element={<Navigate to="/audio-studio" replace />} />
          <Route path="/fake-call" element={<FakeCall />} />
          <Route path="/fake-call/incoming" element={<FakeCallIncoming />} />
          <Route path="/office" element={<Office />} />
          <Route path="/office/to-pdf" element={<ToPdf />} />
          <Route path="/office/converter" element={<Converter />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </AppErrorBoundary>
        <AppErrorBoundary>
        <VoiceNotesFAB />
        <DailyChestModal />
        <ReminderAlert />
        </AppErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
