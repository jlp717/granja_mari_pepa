"use client";

import { useLocale } from "next-intl";
import { WordReveal } from "@/components/kage/WordReveal";
import { kageOnest } from "@/components/kage/fonts";
import { OperationsFrame } from "./Operations";
import {
  getOperationsCopy,
  useOperationsCopy,
  type OperationsCopy,
} from "./copy";
import styles from "./operations.module.css";

type StateKind = "loading" | "error" | "offline" | "missing";
interface StateViewProps {
  kind: StateKind;
  copy: OperationsCopy;
  locale?: string;
  reset?: () => void;
  goBack?: () => void;
  reveal?: boolean;
}

export function StateView({
  kind,
  copy,
  locale = "es",
  reset,
  goBack,
  reveal = false,
}: StateViewProps) {
  const title =
    kind === "loading"
      ? copy.loadingTitle
      : kind === "error"
        ? copy.errorTitle
        : kind === "offline"
          ? copy.offlineTitle
          : copy.missingTitle;
  const body =
    kind === "loading"
      ? copy.loadingBody
      : kind === "error"
        ? copy.errorBody
        : kind === "offline"
          ? copy.offlineBody
          : copy.missingBody;
  const label =
    kind === "loading"
      ? copy.loadingLabel
      : kind === "error"
        ? copy.errorLabel
        : kind === "offline"
          ? copy.offlineLabel
          : copy.missingLabel;
  return (
    <section
      id={`state-${kind}`}
      className={styles.state}
      aria-label={label}
      data-fx={reveal ? "word-reveal form-feedback" : "form-feedback"}
    >
      <p className={styles.stateCode}>
        {kind === "missing" ? `404 / ${label}` : label}
      </p>
      {reveal ? (
        <WordReveal as="h1" className={`h-sec ${styles.title}`}>
          {title}
        </WordReveal>
      ) : (
        <h1 className={styles.title}>{title}</h1>
      )}
      <p
        className={styles.body}
        role={kind === "loading" ? "status" : undefined}
        aria-live={kind === "loading" ? "polite" : undefined}
      >
        {body}
      </p>
      {kind === "loading" && (
        <div className={styles.skeletons} aria-hidden="true">
          <span className={styles.skeleton} />
          <span className={styles.skeleton} />
          <span className={styles.skeleton} />
        </div>
      )}
      <div className={styles.actions}>
        {reset && (
          <button type="button" onClick={reset} className={styles.button}>
            {kind === "offline" ? copy.refresh : copy.retry}
          </button>
        )}
        {goBack && (
          <button type="button" onClick={goBack} className={styles.button}>
            {copy.back}
          </button>
        )}
        <a href={`/${locale}`} className={styles.link}>
          {copy.home}
        </a>
        <a href={`/${locale}/contacto`} className={styles.link}>
          {copy.contact}
        </a>
      </div>
    </section>
  );
}

export function OperationalState({
  kind,
  reset,
  goBack,
}: {
  kind: StateKind;
  reset?: () => void;
  goBack?: () => void;
}) {
  const copy = useOperationsCopy();
  const locale = useLocale();
  return (
    <OperationsFrame routeId={`state-${kind}`} mode="static">
      <StateView
        kind={kind}
        copy={copy}
        locale={locale}
        reset={reset}
        goBack={goBack}
        reveal
      />
    </OperationsFrame>
  );
}

/** Global fallback: no session, translation or scene provider is required. */
export function RootState({
  kind,
  reset,
}: {
  kind: "error" | "missing";
  reset?: () => void;
}) {
  return (
    <div
      className={`${kageOnest.variable} ${styles.scope} ${styles.standalone}`}
    >
      <StateView
        kind={kind}
        copy={getOperationsCopy("es")}
        locale="es"
        reset={reset}
      />
    </div>
  );
}
