"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Minus, Plus, X, Check } from "lucide-react";
import { useCartStore } from "@/lib/store";
import {
  OperationsFrame,
  OperationsIntro,
} from "@/components/gmp/operations/Operations";
import { useOperationsCopy } from "@/components/gmp/operations/copy";
import {
  createLocalDraft,
  LOCAL_DRAFT_KEY,
  type DraftAddress,
  type LocalDraft,
} from "@/components/gmp/operations/draft";
import styles from "@/components/gmp/operations/operations.module.css";

const blankAddress: DraftAddress = {
  name: "",
  street: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  type: "business",
};

export default function CheckoutPage() {
  const copy = useOperationsCopy();
  const locale = useLocale();
  const {
    items: cartItems,
    updateQuantity,
    removeItem,
    getTotalPrice,
  } = useCartStore();
  const [address, setAddress] = useState<DraftAddress>(blankAddress);
  const [paymentPreference, setPaymentPreference] =
    useState<LocalDraft["paymentPreference"]>("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">(
    "idle",
  );
  const total = getTotalPrice();
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  });
  const fields: Array<{
    key: Exclude<keyof DraftAddress, "type">;
    label: string;
    autoComplete: string;
  }> = [
    { key: "name", label: copy.name, autoComplete: "organization" },
    { key: "street", label: copy.street, autoComplete: "street-address" },
    { key: "city", label: copy.city, autoComplete: "address-level2" },
    { key: "state", label: copy.region, autoComplete: "address-level1" },
    { key: "zipCode", label: copy.postal, autoComplete: "postal-code" },
    { key: "country", label: copy.country, autoComplete: "country-name" },
  ];
  const saveDraft = () => {
    if (!reviewed) return;
    try {
      const draft = createLocalDraft(
        cartItems,
        address,
        paymentPreference,
        reference,
        notes,
        new Date().toISOString(),
      );
      window.localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(draft));
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  return (
    <OperationsFrame routeId="checkout" mode="ambient" className={styles.publicScope}>
      <OperationsIntro
        id="draft-intro"
        label={copy.draftLabel}
        title={copy.draftTitle}
        body={copy.draftBody}
      />
      <section
        id="draft-items"
        className={styles.section}
        aria-labelledby="draft-items-title"
        data-fx="form-feedback"
      >
        <h2 id="draft-items-title" className={styles.sectionTitle}>
          {copy.draftItems}
        </h2>
        {cartItems.length === 0 ? (
          <div className={styles.empty}>
            <h3>{copy.draftEmpty}</h3>
            <p>{copy.draftEmptyBody}</p>
            <div className={styles.actions}>
              <a className={styles.link} href={`/${locale}/productos`}>
                {copy.catalogue}
              </a>
              <a className={styles.link} href={`/${locale}/contacto`}>
                {copy.contact}
              </a>
            </div>
          </div>
        ) : (
          <ul className={styles.items}>
            {cartItems.map(({ product, quantity }) => (
              <li className={styles.item} key={product.id}>
                <img
                  src={product.image}
                  alt=""
                  width="80"
                  height="80"
                  loading="lazy"
                />
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.units}</p>
                  <span>{money.format(product.price)}</span>
                </div>
                <div className={styles.quantity}>
                  <button
                    type="button"
                    aria-label={`${copy.reduceQuantity}: ${product.name}`}
                    onClick={() =>
                      updateQuantity(product.id, Math.max(1, quantity - 1))
                    }
                    disabled={quantity <= 1}
                  >
                    <Minus aria-hidden="true" size={16} />
                  </button>
                  <output aria-label={`${copy.quantity}: ${product.name}`}>
                    {quantity}
                  </output>
                  <button
                    type="button"
                    aria-label={`${copy.addQuantity}: ${product.name}`}
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                  >
                    <Plus aria-hidden="true" size={16} />
                  </button>
                </div>
                <span>{money.format(product.price * quantity)}</span>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label={`${copy.remove}: ${product.name}`}
                  onClick={() => removeItem(product.id)}
                >
                  <X aria-hidden="true" size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className={styles.total}>
          <div>
            <p>{copy.draftTotal}</p>
            <small>{copy.draftTotalHelp}</small>
          </div>
          <output>{money.format(total)}</output>
        </div>
      </section>
      <section
        id="draft-details"
        className={`${styles.section} gmp-form`}
        aria-labelledby="draft-details-title"
        data-fx="form-feedback"
      >
        <h2 id="draft-details-title" className={styles.sectionTitle}>
          {copy.draftDetails}
        </h2>
        <fieldset>
          <legend>{copy.draftAddress}</legend>
          <div className={styles.fieldGrid}>
            {fields.map(({ key, label, autoComplete }) => (
              <div className={styles.field} key={key}>
                <label htmlFor={`draft-${key}`}>{label}</label>
                <input
                  id={`draft-${key}`}
                  autoComplete={autoComplete}
                  value={address[key]}
                  onChange={(event) => {
                    setAddress({ ...address, [key]: event.target.value });
                    setSaveState("idle");
                  }}
                />
              </div>
            ))}
            <div className={styles.field}>
              <label htmlFor="draft-address-type">{copy.addressType}</label>
              <select
                id="draft-address-type"
                value={address.type}
                onChange={(event) =>
                  setAddress({
                    ...address,
                    type: event.target.value as DraftAddress["type"],
                  })
                }
              >
                <option value="business">{copy.business}</option>
                <option value="home">{copy.personal}</option>
              </select>
            </div>
          </div>
        </fieldset>
        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label htmlFor="draft-payment">{copy.draftPayment}</label>
            <select
              id="draft-payment"
              aria-describedby="draft-payment-help"
              value={paymentPreference}
              onChange={(event) =>
                setPaymentPreference(
                  event.target.value as LocalDraft["paymentPreference"],
                )
              }
            >
              <option value="">{copy.paymentNone}</option>
              <option value="card">{copy.paymentCard}</option>
              <option value="bank">{copy.paymentBank}</option>
              <option value="paypal">{copy.paymentPaypal}</option>
            </select>
            <small id="draft-payment-help">{copy.draftPaymentHelp}</small>
          </div>
          <div className={styles.field}>
            <label htmlFor="draft-reference">{copy.draftPromo}</label>
            <input
              id="draft-reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
            />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="draft-notes">{copy.draftNotes}</label>
          <textarea
            id="draft-notes"
            value={notes}
            rows={4}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
      </section>
      <section
        id="draft-result"
        className={styles.section}
        aria-label={copy.draftSave}
        data-fx="form-feedback"
      >
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={reviewed}
            onChange={(event) => setReviewed(event.target.checked)}
          />
          {copy.draftReview}
        </label>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.button}
            disabled={!reviewed}
            onClick={saveDraft}
          >
            {copy.draftSave}
            <Check aria-hidden="true" size={18} />
          </button>
          <a className={styles.link} href={`/${locale}/contacto`}>
            {copy.contact}
          </a>
        </div>
        <div aria-live="polite">
          {saveState === "saved" && (
            <div className={styles.feedback} role="status">
              <h2>{copy.draftSaved}</h2>
              <p>{copy.draftSavedBody}</p>
            </div>
          )}
          {saveState === "error" && (
            <p className={styles.feedback} role="alert">
              {copy.draftSaveError}
            </p>
          )}
        </div>
      </section>
    </OperationsFrame>
  );
}
