import requests
import csv
from datetime import date, timedelta

# ==================== CREDENCIALES ====================
ACTIVITY_UID = "ASOC-B04008710"
USERNAME     = "B04008710@asociado.topgel.es"
PASSWORD     = "0019-B04008710"

# ==================== URL ====================
BASE_URL = "https://api.b2bgrupotopgel.es"

LOGIN_URL  = f"{BASE_URL}/api/v2/loyalty/login"
ORDERS_URL = f"{BASE_URL}/czz-to-erp/rest/ordersIntegration"

# RANGOS DE FECHAS A CONSULTAR
rangos = [
    ("2026-03-16", "2026-03-22"),
    ("2026-03-23", "2026-03-29"),
    ("2026-03-30", "2026-03-30"),
]

print("🚀 Conectando a TopGel PRODUCCIÓN")

# 1. Login  —  CORRECCIÓN: el campo es "activityUid" (con d), NO "activityUiq"
login_body = {
    "activityUid": ACTIVITY_UID,   # ← CORREGIDO (era "activityUiq")
    "username": USERNAME,
    "password": PASSWORD
}

resp_login = requests.post(LOGIN_URL, json=login_body)
print(f"[DEBUG] Código login: {resp_login.status_code}")

if resp_login.status_code != 200:
    print(f"❌ Error en login: {resp_login.status_code}")
    print(resp_login.text)
    exit(1)

try:
    token = resp_login.json()["token"]
    print("✅ Login correcto")
except Exception as e:
    print(f"❌ Error parseando JSON de login: {e}")
    exit(1)

headers = {"Authorization": f"Bearer {token}"}

# 2. Recorrer los rangos de fechas
for inicio, fin in rangos:
    fecha_ini = date.fromisoformat(inicio)
    fecha_fin = date.fromisoformat(fin)
    fecha_actual = fecha_ini

    while fecha_actual <= fecha_fin:
        fecha_str = fecha_actual.isoformat()
        params = {"fecha_pedido": fecha_str}
        resp = requests.get(ORDERS_URL, headers=headers, params=params)

        if resp.status_code == 401:
            print(f"❌ Token inválido o caducado para {fecha_str}")
            exit(1)
        elif resp.status_code != 200:
            print(f"❌ Error al obtener pedidos para {fecha_str}: {resp.status_code}")
            print(resp.text)
            fecha_actual += timedelta(days=1)
            continue

        data = resp.json()
        pedidos = data.get("pedidos", [])

        if not pedidos:
            print(f"ℹ️  No hay pedidos para {fecha_str}.")
            fecha_actual += timedelta(days=1)
            continue

        # 3. Generar CSV
        csv_filename = f"pedidos_topgel_{fecha_str}.csv"

        with open(csv_filename, mode="w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f, delimiter=";")
            writer.writerow([
                "documentNumber", "fecha_pedido", "comprador", "proveedor_codigo",
                "proveedor_descripcion", "fecha_entrega", "total_sin_promocion",
                "precio_con_promocion", "estado", "tarifaID",
                "linea", "codigo_artículo", "total_unidades", "total_cajas", "precio_unidad_final"
            ])

            for pedido in pedidos:
                cab = pedido["cabecera"]
                lineas = pedido.get("lineas", [])

                for linea in lineas:
                    writer.writerow([
                        cab["documentNumber"], cab["fecha_pedido"], cab["comprador"],
                        cab["proveedor_codigo"], cab.get("proveedor_descripcion", ""),
                        cab["fecha_entrega"], cab["total_sin_promocion"],
                        cab["precio_con_promocion"], cab.get("estado", ""),
                        cab["tarifaID"],
                        linea["linea"], linea["codigo_artículo"],
                        linea["total_unidades"], linea["total_cajas"], linea["precio_unidad_final"]
                    ])

                # Línea de PORTES
                writer.writerow([
                    cab["documentNumber"], cab["fecha_pedido"], cab["comprador"],
                    cab["proveedor_codigo"], cab.get("proveedor_descripcion", ""),
                    cab["fecha_entrega"], cab["total_sin_promocion"],
                    cab["precio_con_promocion"], cab.get("estado", ""),
                    cab["tarifaID"],
                    len(lineas) + 1, "PORTES", 1, 0, 0.0
                ])

        print(f"✅ CSV generado → {csv_filename} (Pedidos: {len(pedidos)})")
        fecha_actual += timedelta(days=1)