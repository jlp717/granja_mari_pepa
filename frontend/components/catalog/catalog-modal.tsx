
"use client";

import { useEffect, useState } from "react";
import { X, BookOpen, Download } from "lucide-react"; // Icons
import { motion, AnimatePresence } from "@/lib/native-motion";

interface CatalogModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfUrl: string;
    title?: string;
    edition?: string;
}

export const CatalogModal = ({
    isOpen,
    onClose,
    pdfUrl,
    title = "Catálogo - Revista Mensual",
    edition = "Edición Febrero 2026",
}: CatalogModalProps) => {
    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm transition-all"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                    >
                        <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-border/50">

                            {/* Header Bar */}
                            <div className="flex items-center justify-between px-6 py-4 bg-primary text-primary-foreground select-none">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-full">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight">{title}</h3>
                                        <p className="text-xs text-primary-foreground/80 font-medium tracking-wide uppercase">
                                            {edition}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <a
                                        href={pdfUrl}
                                        download
                                        className="p-2 hover:bg-white/20 rounded-full transition-colors flex items-center gap-2 text-sm font-medium mr-2"
                                        title="Descargar PDF"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span className="hidden sm:inline">Descargar</span>
                                    </a>

                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* PDF Viewer (Iframe) */}
                            <div className="flex-1 bg-gray-100 relative w-full h-full">
                                <iframe
                                    src={`${pdfUrl}#view=FitH`}
                                    className="w-full h-full"
                                    title="PDF Viewer"
                                    frameBorder="0"
                                />
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
