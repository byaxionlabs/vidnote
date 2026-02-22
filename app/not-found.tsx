import Link from "next/link";
import { ArrowLeft, Sparkles, Zap, FileText } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-chart-2/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
                <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-chart-3/3 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 text-center max-w-lg">
                {/* 404 Number */}
                <div className="relative mb-6">
                    <h1 className="text-[10rem] md:text-[12rem] font-bold text-primary/10 leading-none select-none font-serif">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-28 h-28 rounded-3xl bg-card border-2 border-dashed border-border flex items-center justify-center shadow-lg">
                            <Zap size={48} className="text-primary" />
                        </div>
                    </div>
                </div>

                {/* Brand */}
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles size={20} className="text-primary" />
                    <span className="text-sm font-medium text-primary uppercase tracking-wider">Theo Notes</span>
                    <Sparkles size={20} className="text-primary" />
                </div>

                {/* Heading */}
                <h2 className="text-3xl md:text-4xl mb-4 text-foreground font-serif">
                    Page <span className="text-primary italic">Not Found</span>
                </h2>

                {/* Description */}
                <p className="text-muted-foreground text-lg mb-3 leading-relaxed">
                    Looks like this page doesn&apos;t exist — even Theo couldn&apos;t find it.
                </p>
                <p className="text-muted-foreground text-sm mb-10">
                    Maybe you followed a broken link, or the page has been moved.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                    >
                        <FileText size={18} />
                        Go to Dashboard
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-8 py-4 border-2 border-border text-foreground font-medium rounded-xl hover:bg-accent hover:border-primary/50 transition-all"
                    >
                        <ArrowLeft size={18} />
                        Back to Home
                    </Link>
                </div>
            </div>

            {/* Footer Note */}
            <div className="relative z-10 mt-16 text-sm text-muted-foreground">
                <span className="text-primary font-medium">@t3dotgg</span> • Theo Notes — video insights, powered by AI
            </div>
        </div>
    );
}
