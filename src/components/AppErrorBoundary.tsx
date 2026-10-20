import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, info: ErrorInfo) {
    console.error("Madar page failed", info.componentStack);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-5 px-6 text-center font-cairo">
      <AlertTriangle className="h-10 w-10 text-gold" />
      <h1 className="text-xl font-bold">حصل خلل بسيط في المدار</h1>
      <p className="text-sm text-muted-foreground">جرّب مرة تانية؛ بياناتك المحفوظة لم تُحذف.</p>
      <div className="flex gap-3">
        <Button onClick={() => window.location.reload()}><RotateCcw />إعادة المحاولة</Button>
        <Button variant="outline" asChild><a href="/"><Home />الرئيسية</a></Button>
      </div>
    </main>;
  }
}