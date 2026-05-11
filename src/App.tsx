import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import AiChat from "./pages/AiChat.tsx";
import Studio from "./pages/Studio.tsx";
import StudioToolPage from "./pages/StudioToolPage.tsx";
import StudioQuickEdit from "./pages/StudioQuickEdit.tsx";
import AnimeStudio from "./pages/AnimeStudio.tsx";
import OutfitterStudio from "./pages/OutfitterStudio.tsx";
import Settings from "./pages/Settings.tsx";
import AlWajib from "./pages/AlWajib.tsx";
import TemplateEditor from "./pages/TemplateEditor.tsx";
import DataSaver from "./pages/DataSaver.tsx";
import ZoolShare from "./pages/ZoolShare.tsx";
import Scanner from "./pages/Scanner.tsx";
import ZoolYafatish from "./pages/ZoolYafatish.tsx";
import VoiceChanger from "./pages/VoiceChanger.tsx";
import AudioStudio from "./pages/AudioStudio.tsx";
import MediaFactory from "./pages/audio/MediaFactory.tsx";
import VoiceOver from "./pages/audio/VoiceOver.tsx";
import Remix from "./pages/audio/Remix.tsx";
import FakeCall from "./pages/FakeCall.tsx";
import FakeCallIncoming from "./pages/FakeCallIncoming.tsx";
import Office from "./pages/office/Office.tsx";
import ToPdf from "./pages/office/ToPdf.tsx";
import Converter from "./pages/office/Converter.tsx";
import NotFound from "./pages/NotFound.tsx";
import VoiceNotesFAB from "./components/VoiceNotesFAB.tsx";
import DailyChestModal from "./components/DailyChestModal.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
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
          <Route path="/audio-studio/remix" element={<Remix />} />
          <Route path="/fake-call" element={<FakeCall />} />
          <Route path="/fake-call/incoming" element={<FakeCallIncoming />} />
          <Route path="/office" element={<Office />} />
          <Route path="/office/to-pdf" element={<ToPdf />} />
          <Route path="/office/converter" element={<Converter />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <VoiceNotesFAB />
        <DailyChestModal />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
