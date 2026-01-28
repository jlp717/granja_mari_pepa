'use client';

import { Tolgee, DevTools, TolgeeProvider as TolgeeReactProvider } from "@tolgee/react";
import { FormatIcu } from "@tolgee/format-icu";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import en from "../../messages/en.json";
import es from "../../messages/es.json";
import de from "../../messages/de.json";
import it from "../../messages/it.json";
import zh from "../../messages/zh.json";

const tolgee = Tolgee()
    .use(DevTools())
    .use(FormatIcu())
    .init({
        defaultLanguage: 'es',
        availableLanguages: ['es', 'en', 'de', 'it', 'zh'],
        // In development: use API to fetch/edit. In prod: use static files if possible, or API if configured.
        apiKey: process.env.NEXT_PUBLIC_TOLGEE_API_KEY,
        apiUrl: process.env.NEXT_PUBLIC_TOLGEE_API_URL || "https://app.tolgee.io",
        staticData: {
            en: en as any,
            es: es as any,
            de: de as any,
            it: it as any,
            zh: zh as any,
            // Ideally we would load these dynamically or they would be fetched from API in dev
        },
    });

export const TolgeeProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <TolgeeReactProvider tolgee={tolgee}>
            {children}
        </TolgeeReactProvider>
    );
};
