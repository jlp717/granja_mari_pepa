'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@/lib/navigation';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { isolateBackground } from '@/components/kage/navigation/inert';
import styles from './cart-drawer.module.css';

const price = (value: number) => `${value.toFixed(2).replace('.', ',')} €`;

export function CartDrawer() {
  const router = useRouter();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<number>(0);
  const [isAnimatingRemove, setIsAnimatingRemove] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{ type: string; message: string } | null>(null);

  const {
    items,
    isOpen,
    toggleCart,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalPrice,
    getTotalItems,
  } = useCartStore();

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.classList.add('cart-open');
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.classList.remove('cart-open');
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.classList.remove('cart-open');
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (showDeleteDialog) {
        setShowDeleteDialog(false);
        setItemToDelete(null);
      } else if (showClearDialog) {
        setShowClearDialog(false);
      } else {
        toggleCart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, showDeleteDialog, showClearDialog, toggleCart]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previous?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const background = [
      document.querySelector('main'),
      document.querySelector('footer.foot'),
    ].filter((element): element is HTMLElement => Boolean(element));
    return isolateBackground(background);
  }, [isOpen]);

  const handleProceedToCheckout = () => {
    toggleCart();
    setTimeout(() => router.push('/checkout'), 300);
  };

  const startEditing = (itemId: string, currentQuantity: number) => {
    setEditingItem(itemId);
    setTempQuantity(currentQuantity);
  };

  const saveQuantity = (itemId: string) => {
    if (tempQuantity > 0) updateQuantity(itemId, tempQuantity);
    setEditingItem(null);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setTempQuantity(0);
  };

  const handleKeyPress = (event: React.KeyboardEvent, itemId: string) => {
    if (event.key === 'Enter') saveQuantity(itemId);
    else if (event.key === 'Escape') cancelEditing();
  };

  const handleRemoveItem = (itemId: string, productName: string) => {
    setItemToDelete({ id: itemId, name: productName });
    setShowDeleteDialog(true);
  };

  const confirmRemoveItem = () => {
    if (!itemToDelete) return;
    setIsAnimatingRemove(itemToDelete.id);
    setTimeout(() => {
      removeItem(itemToDelete.id);
      setIsAnimatingRemove(null);
      setNotificationMessage('Producto eliminado del pedido');
      setTimeout(() => setNotificationMessage(null), 3000);
    }, 240);
    setShowDeleteDialog(false);
    setItemToDelete(null);
  };

  const handleClearCart = () => setShowClearDialog(true);

  const confirmClearCart = () => {
    const count = getTotalItems();
    clearCart();
    setNotificationMessage(
      count === 1 ? 'Producto eliminado del pedido' : `${count} productos eliminados del pedido`,
    );
    setTimeout(() => setNotificationMessage(null), 4000);
    setShowClearDialog(false);
  };

  const handleQuantityChange = (itemId: string, newQuantity: number, productName: string) => {
    const oldQuantity = items.find((item) => item.product.id === itemId)?.quantity || 0;

    if (newQuantity <= 0) {
      setItemToDelete({ id: itemId, name: productName });
      setShowDeleteDialog(true);
      return;
    }

    updateQuantity(itemId, newQuantity);

    if (newQuantity > oldQuantity) {
      setLastAction({ type: 'increase', message: `${productName}: ${newQuantity} unidades` });
    } else if (newQuantity < oldQuantity) {
      setLastAction({ type: 'decrease', message: `${productName}: ${newQuantity} unidades` });
    }

    setTimeout(() => setLastAction(null), 3200);
  };

  const handleExploreProducts = () => {
    toggleCart();
    router.push('/productos');
  };

  const notice = notificationMessage || lastAction?.message;

  return (
    <>
      {isOpen && (
        <div className={styles.root}>
          <button
            type="button"
            className={styles.scrim}
            aria-label="Cerrar carrito"
            onClick={toggleCart}
          />

          <aside
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
          >
            <header className={styles.head}>
              <div>
                <span className={styles.kicker}>Pedido</span>
                <h2 className={styles.title} id="cart-title">
                  Carrito{' '}
                  <span className={styles.count}>
                    {getTotalItems() === 0
                      ? 'Vacío'
                      : getTotalItems() === 1
                        ? '1 artículo'
                        : `${getTotalItems()} artículos`}
                  </span>
                </h2>
              </div>
              <button
                type="button"
                ref={closeRef}
                className={styles.close}
                onClick={toggleCart}
                aria-label="Cerrar carrito"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <div className={styles.body}>
              {items.length === 0 ? (
                <div className={styles.empty}>
                  <span className={styles.emptyIcon}>
                    <ShoppingBag size={22} aria-hidden="true" />
                  </span>
                  <h3>Tu carrito está vacío</h3>
                  <p>
                    Añade referencias del catálogo para preparar el pedido. Puedes revisarlo
                    antes de confirmarlo.
                  </p>
                  <button type="button" className={styles.primary} onClick={handleExploreProducts}>
                    Abrir catálogo
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <ul className={styles.items}>
                  {items.map((item) => (
                    <li
                      key={item.product.id}
                      className={`${styles.item} ${
                        isAnimatingRemove === item.product.id ? styles.itemOut : ''
                      }`}
                    >
                      <div className={styles.thumb}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- catalogue images are runtime URLs */}
                        <img src={item.product.image} alt={item.product.name} />
                      </div>
                      <div className={styles.itemBody}>
                        <div className={styles.itemTop}>
                          <h3>{item.product.name}</h3>
                          <button
                            type="button"
                            className={styles.remove}
                            onClick={() => handleRemoveItem(item.product.id, item.product.name)}
                            aria-label={`Eliminar ${item.product.name} del pedido`}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        </div>
                        <p className={styles.unit}>
                          {item.product.price
                            ? `${price(item.product.price)} / ud`
                            : 'Precio no disponible'}
                        </p>
                        <div className={styles.itemBottom}>
                          <div className={styles.stepper}>
                            <button
                              type="button"
                              onClick={() =>
                                handleQuantityChange(
                                  item.product.id,
                                  item.quantity - 1,
                                  item.product.name,
                                )
                              }
                              aria-label="Quitar una unidad"
                            >
                              <Minus size={12} aria-hidden="true" />
                            </button>
                            {editingItem === item.product.id ? (
                              <input
                                className={styles.qtyInput}
                                type="number"
                                min="1"
                                max="99"
                                value={tempQuantity}
                                autoFocus
                                onChange={(event) =>
                                  setTempQuantity(parseInt(event.target.value) || 0)
                                }
                                onKeyDown={(event) => handleKeyPress(event, item.product.id)}
                                onBlur={() => saveQuantity(item.product.id)}
                                aria-label={`Cantidad de ${item.product.name}`}
                              />
                            ) : (
                              <button
                                type="button"
                                className={styles.qty}
                                onClick={() => startEditing(item.product.id, item.quantity)}
                                aria-label={`Editar cantidad de ${item.product.name}`}
                              >
                                {item.quantity}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                handleQuantityChange(
                                  item.product.id,
                                  item.quantity + 1,
                                  item.product.name,
                                )
                              }
                              aria-label="Añadir una unidad"
                            >
                              <Plus size={12} aria-hidden="true" />
                            </button>
                          </div>
                          <b className={styles.line}>
                            {item.product.price
                              ? price(item.product.price * item.quantity)
                              : '—'}
                          </b>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <footer className={styles.foot}>
                <p className={styles.notice} role="status" aria-live="polite">
                  {notice || `${getTotalItems()} artículos en el pedido`}
                </p>
                <div className={styles.totalRow}>
                  <span>Total</span>
                  <b>{price(getTotalPrice())}</b>
                </div>
                <p className={styles.totalNote}>El importe final se confirma en el checkout.</p>
                <button type="button" className={styles.primary} onClick={handleProceedToCheckout}>
                  Tramitar pedido
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
                <button type="button" className={styles.clear} onClick={handleClearCart}>
                  Vaciar carrito
                </button>
              </footer>
            )}
          </aside>
        </div>
      )}

      {showDeleteDialog && (
        <div className={styles.confirmLayer}>
          <div
            className={styles.confirm}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-delete-title"
          >
            <span className={styles.confirmKicker}>Carrito</span>
            <h2 id="cart-delete-title">Eliminar producto</h2>
            <p>
              <b>{itemToDelete?.name}</b> saldrá del pedido. Puedes volver a añadirlo desde el
              catálogo.
            </p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  setShowDeleteDialog(false);
                  setItemToDelete(null);
                }}
              >
                Cancelar
              </button>
              <button type="button" className={styles.danger} onClick={confirmRemoveItem}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearDialog && (
        <div className={styles.confirmLayer}>
          <div
            className={styles.confirm}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-clear-title"
          >
            <span className={styles.confirmKicker}>Carrito</span>
            <h2 id="cart-clear-title">Vaciar el carrito</h2>
            <p>
              Se quitarán los {getTotalItems() === 1 ? 'artículo' : `${getTotalItems()} artículos`}{' '}
              del pedido. El catálogo sigue disponible.
            </p>
            <div className={styles.confirmActions}>
              <button type="button" autoFocus onClick={() => setShowClearDialog(false)}>
                Cancelar
              </button>
              <button type="button" className={styles.danger} onClick={confirmClearCart}>
                Vaciar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
