/**
 * PARSEAR TEXTO DE REFERENCIA Y ENCONTRAR DIFERENCIAS
 * ====================================================
 * Extraer todas las facturas del texto de referencia y comparar con nuestros datos
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';

// Lista de facturas del texto de referencia (solo el número de factura de cada línea principal)
const FACTURAS_REFERENCIA = [
    { ejercicio: 2024, serie: 'A', numero: 9112 },
    { ejercicio: 2024, serie: 'A', numero: 9160 },
    { ejercicio: 2024, serie: 'A', numero: 9161 },
    { ejercicio: 2025, serie: 'A', numero: 27 },
    { ejercicio: 2025, serie: 'A', numero: 28 },
    { ejercicio: 2025, serie: 'A', numero: 60 },
    { ejercicio: 2025, serie: 'A', numero: 61 },
    { ejercicio: 2025, serie: 'A', numero: 85 },
    { ejercicio: 2025, serie: 'A', numero: 95 },
    { ejercicio: 2025, serie: 'A', numero: 108 },
    { ejercicio: 2025, serie: 'A', numero: 110 },
    { ejercicio: 2025, serie: 'A', numero: 147 },
    { ejercicio: 2025, serie: 'A', numero: 153 },
    { ejercicio: 2025, serie: 'A', numero: 176 },
    { ejercicio: 2025, serie: 'A', numero: 177 },
    { ejercicio: 2025, serie: 'A', numero: 198 },
    { ejercicio: 2025, serie: 'A', numero: 206 },
    { ejercicio: 2025, serie: 'A', numero: 207 },
    { ejercicio: 2025, serie: 'A', numero: 214 },
    { ejercicio: 2025, serie: 'A', numero: 234 },
    { ejercicio: 2025, serie: 'A', numero: 235 },
    { ejercicio: 2025, serie: 'A', numero: 283 },
    { ejercicio: 2025, serie: 'A', numero: 313 },
    { ejercicio: 2025, serie: 'A', numero: 320 },
    { ejercicio: 2025, serie: 'A', numero: 321 },
    { ejercicio: 2025, serie: 'A', numero: 340 },
    { ejercicio: 2025, serie: 'A', numero: 342 },
    { ejercicio: 2025, serie: 'A', numero: 368 },
    { ejercicio: 2025, serie: 'A', numero: 433 },
    { ejercicio: 2025, serie: 'A', numero: 434 },
    { ejercicio: 2025, serie: 'A', numero: 470 },
    { ejercicio: 2025, serie: 'A', numero: 471 },
    { ejercicio: 2025, serie: 'A', numero: 484 },
    { ejercicio: 2025, serie: 'A', numero: 485 },
    { ejercicio: 2025, serie: 'A', numero: 487 },
    { ejercicio: 2025, serie: 'A', numero: 502 },
    { ejercicio: 2025, serie: 'A', numero: 519 },
    { ejercicio: 2025, serie: 'A', numero: 520 },
    { ejercicio: 2025, serie: 'A', numero: 545 },
    { ejercicio: 2025, serie: 'A', numero: 546 },
    { ejercicio: 2025, serie: 'A', numero: 547 },
    { ejercicio: 2025, serie: 'A', numero: 589 },
    { ejercicio: 2025, serie: 'A', numero: 630 },
    { ejercicio: 2025, serie: 'A', numero: 631 },
    { ejercicio: 2025, serie: 'A', numero: 642 },
    { ejercicio: 2025, serie: 'A', numero: 644 },
    { ejercicio: 2025, serie: 'A', numero: 672 },
    { ejercicio: 2025, serie: 'A', numero: 673 },
    { ejercicio: 2025, serie: 'A', numero: 674 },
    { ejercicio: 2025, serie: 'A', numero: 702 },
    { ejercicio: 2025, serie: 'A', numero: 703 },
    { ejercicio: 2025, serie: 'A', numero: 742 },
    { ejercicio: 2025, serie: 'A', numero: 744 },
    { ejercicio: 2025, serie: 'A', numero: 793 },
    { ejercicio: 2025, serie: 'A', numero: 794 },
    { ejercicio: 2025, serie: 'A', numero: 802 },
    { ejercicio: 2025, serie: 'A', numero: 808 },
    { ejercicio: 2025, serie: 'A', numero: 809 },
    { ejercicio: 2025, serie: 'A', numero: 834 },
    { ejercicio: 2025, serie: 'A', numero: 836 },
    { ejercicio: 2025, serie: 'A', numero: 837 },
    { ejercicio: 2025, serie: 'A', numero: 868 },
    { ejercicio: 2025, serie: 'A', numero: 869 },
    { ejercicio: 2025, serie: 'A', numero: 912 },
    { ejercicio: 2025, serie: 'A', numero: 913 },
    { ejercicio: 2025, serie: 'A', numero: 956 },
    { ejercicio: 2025, serie: 'A', numero: 960 },
    { ejercicio: 2025, serie: 'A', numero: 972 },
    { ejercicio: 2025, serie: 'A', numero: 976 },
    { ejercicio: 2025, serie: 'A', numero: 984 },
    { ejercicio: 2025, serie: 'A', numero: 1008 },
    { ejercicio: 2025, serie: 'A', numero: 1044 },
    { ejercicio: 2025, serie: 'A', numero: 1045 },
    { ejercicio: 2025, serie: 'A', numero: 1077 },
    { ejercicio: 2025, serie: 'A', numero: 1080 },
    { ejercicio: 2025, serie: 'A', numero: 1119 },
    { ejercicio: 2025, serie: 'A', numero: 1122 },
    { ejercicio: 2025, serie: 'A', numero: 1130 },
    { ejercicio: 2025, serie: 'A', numero: 1138 },
    { ejercicio: 2025, serie: 'A', numero: 1153 },
    { ejercicio: 2025, serie: 'A', numero: 1162 },
    { ejercicio: 2025, serie: 'A', numero: 1163 },
    { ejercicio: 2025, serie: 'A', numero: 1195 },
    { ejercicio: 2025, serie: 'A', numero: 1202 },
    { ejercicio: 2025, serie: 'A', numero: 1221 },
    { ejercicio: 2025, serie: 'A', numero: 1249 },
    { ejercicio: 2025, serie: 'A', numero: 1250 },
    { ejercicio: 2025, serie: 'A', numero: 1315 },
    { ejercicio: 2025, serie: 'A', numero: 1323 },
    { ejercicio: 2025, serie: 'A', numero: 1328 },
    { ejercicio: 2025, serie: 'A', numero: 1355 },
    { ejercicio: 2025, serie: 'A', numero: 1356 },
    { ejercicio: 2025, serie: 'A', numero: 1379 },
    { ejercicio: 2025, serie: 'A', numero: 1381 },
    { ejercicio: 2025, serie: 'A', numero: 1415 },
    { ejercicio: 2025, serie: 'A', numero: 1464 },
    { ejercicio: 2025, serie: 'A', numero: 1466 },
    { ejercicio: 2025, serie: 'A', numero: 1486 },
    { ejercicio: 2025, serie: 'A', numero: 1492 },
    { ejercicio: 2025, serie: 'A', numero: 1493 },
    { ejercicio: 2025, serie: 'A', numero: 1526 },
    { ejercicio: 2025, serie: 'A', numero: 1527 },
    { ejercicio: 2025, serie: 'A', numero: 1567 },
    { ejercicio: 2025, serie: 'A', numero: 1568 },
    { ejercicio: 2025, serie: 'A', numero: 1569 },
    { ejercicio: 2025, serie: 'A', numero: 1629 },
    { ejercicio: 2025, serie: 'A', numero: 1630 },
    { ejercicio: 2025, serie: 'A', numero: 1635 },
    { ejercicio: 2025, serie: 'A', numero: 1671 },
    { ejercicio: 2025, serie: 'A', numero: 1672 },
    { ejercicio: 2025, serie: 'A', numero: 1673 },
    { ejercicio: 2025, serie: 'A', numero: 1704 },
    { ejercicio: 2025, serie: 'A', numero: 1711 },
    { ejercicio: 2025, serie: 'A', numero: 1789 },
    { ejercicio: 2025, serie: 'A', numero: 1790 },
    { ejercicio: 2025, serie: 'A', numero: 1825 },
    { ejercicio: 2025, serie: 'A', numero: 1826 },
    { ejercicio: 2025, serie: 'A', numero: 1859 },
    { ejercicio: 2025, serie: 'A', numero: 1904 },
    { ejercicio: 2025, serie: 'A', numero: 1905 },
    { ejercicio: 2025, serie: 'A', numero: 1951 },
    { ejercicio: 2025, serie: 'A', numero: 1953 },
    { ejercicio: 2025, serie: 'A', numero: 1972 },
    { ejercicio: 2025, serie: 'A', numero: 1973 },
    { ejercicio: 2025, serie: 'A', numero: 2000 },
    { ejercicio: 2025, serie: 'A', numero: 2001 },
    { ejercicio: 2025, serie: 'A', numero: 2002 },
    { ejercicio: 2025, serie: 'A', numero: 2035 },
    { ejercicio: 2025, serie: 'A', numero: 2036 },
    { ejercicio: 2025, serie: 'A', numero: 2080 },
    { ejercicio: 2025, serie: 'A', numero: 2082 },
    { ejercicio: 2025, serie: 'A', numero: 2125 },
    { ejercicio: 2025, serie: 'A', numero: 2126 },
    { ejercicio: 2025, serie: 'A', numero: 2151 },
    { ejercicio: 2025, serie: 'A', numero: 2152 },
    { ejercicio: 2025, serie: 'A', numero: 2178 },
    { ejercicio: 2025, serie: 'A', numero: 2179 },
    { ejercicio: 2025, serie: 'A', numero: 2224 },
    { ejercicio: 2025, serie: 'A', numero: 2265 },
    { ejercicio: 2025, serie: 'A', numero: 2269 },
    { ejercicio: 2025, serie: 'A', numero: 2270 },
    { ejercicio: 2025, serie: 'A', numero: 2273 },
    { ejercicio: 2025, serie: 'A', numero: 2333 },
    { ejercicio: 2025, serie: 'A', numero: 2334 },
    { ejercicio: 2025, serie: 'A', numero: 2356 },
    { ejercicio: 2025, serie: 'A', numero: 2363 },
    { ejercicio: 2025, serie: 'A', numero: 2405 },
    { ejercicio: 2025, serie: 'A', numero: 2411 },
    { ejercicio: 2025, serie: 'A', numero: 2476 },
    { ejercicio: 2025, serie: 'A', numero: 2477 },
    { ejercicio: 2025, serie: 'A', numero: 2520 },
    { ejercicio: 2025, serie: 'A', numero: 2524 },
    { ejercicio: 2025, serie: 'A', numero: 2567 },
    { ejercicio: 2025, serie: 'A', numero: 2568 },
    { ejercicio: 2025, serie: 'A', numero: 2609 },
    { ejercicio: 2025, serie: 'A', numero: 2610 },
    { ejercicio: 2025, serie: 'A', numero: 2656 },
    { ejercicio: 2025, serie: 'A', numero: 2659 },
    { ejercicio: 2025, serie: 'A', numero: 2660 },
    { ejercicio: 2025, serie: 'A', numero: 2740 },
    { ejercicio: 2025, serie: 'A', numero: 2744 },
    { ejercicio: 2025, serie: 'A', numero: 2798 },
    { ejercicio: 2025, serie: 'A', numero: 2799 },
    { ejercicio: 2025, serie: 'A', numero: 2865 },
    { ejercicio: 2025, serie: 'A', numero: 2866 },
    { ejercicio: 2025, serie: 'A', numero: 2867 },
    { ejercicio: 2025, serie: 'A', numero: 2909 },
    { ejercicio: 2025, serie: 'A', numero: 2910 },
    { ejercicio: 2025, serie: 'A', numero: 2937 },
    { ejercicio: 2025, serie: 'A', numero: 2942 },
    { ejercicio: 2025, serie: 'A', numero: 2945 },
    { ejercicio: 2025, serie: 'A', numero: 2959 },
    { ejercicio: 2025, serie: 'A', numero: 2995 },
    { ejercicio: 2025, serie: 'A', numero: 2996 },
    { ejercicio: 2025, serie: 'A', numero: 2997 },
    { ejercicio: 2025, serie: 'A', numero: 3054 },
    { ejercicio: 2025, serie: 'A', numero: 3104 },
    { ejercicio: 2025, serie: 'A', numero: 3105 },
    { ejercicio: 2025, serie: 'A', numero: 3162 },
    { ejercicio: 2025, serie: 'A', numero: 3163 },
    { ejercicio: 2025, serie: 'A', numero: 3183 },
    { ejercicio: 2025, serie: 'A', numero: 3193 },
    { ejercicio: 2025, serie: 'A', numero: 3194 },
    { ejercicio: 2025, serie: 'A', numero: 3231 },
    { ejercicio: 2025, serie: 'A', numero: 3272 },
    { ejercicio: 2025, serie: 'A', numero: 3273 },
    { ejercicio: 2025, serie: 'A', numero: 3330 },
    { ejercicio: 2025, serie: 'A', numero: 3331 },
    { ejercicio: 2025, serie: 'A', numero: 3357 },
    { ejercicio: 2025, serie: 'A', numero: 3373 },
    { ejercicio: 2025, serie: 'A', numero: 3379 },
    { ejercicio: 2025, serie: 'A', numero: 3380 },
    { ejercicio: 2025, serie: 'A', numero: 3425 },
    { ejercicio: 2025, serie: 'A', numero: 3427 },
    { ejercicio: 2025, serie: 'A', numero: 3480 },
    { ejercicio: 2025, serie: 'A', numero: 3481 },
    { ejercicio: 2025, serie: 'A', numero: 3530 },
    { ejercicio: 2025, serie: 'A', numero: 3531 },
    { ejercicio: 2025, serie: 'A', numero: 3577 },
    { ejercicio: 2025, serie: 'A', numero: 3600 },
    { ejercicio: 2025, serie: 'A', numero: 3604 },
    { ejercicio: 2025, serie: 'A', numero: 3630 },
    { ejercicio: 2025, serie: 'A', numero: 3632 },
    { ejercicio: 2025, serie: 'A', numero: 3713 },
    { ejercicio: 2025, serie: 'A', numero: 3718 },
    { ejercicio: 2025, serie: 'A', numero: 3762 },
    { ejercicio: 2025, serie: 'A', numero: 3763 },
    { ejercicio: 2025, serie: 'A', numero: 3766 },
    { ejercicio: 2025, serie: 'A', numero: 3789 },
    { ejercicio: 2025, serie: 'A', numero: 3790 },
    { ejercicio: 2025, serie: 'A', numero: 3820 },
    { ejercicio: 2025, serie: 'A', numero: 3821 },
    { ejercicio: 2025, serie: 'A', numero: 3822 },
    { ejercicio: 2025, serie: 'A', numero: 3863 },
    { ejercicio: 2025, serie: 'A', numero: 3871 },
    { ejercicio: 2025, serie: 'A', numero: 3872 },
    { ejercicio: 2025, serie: 'A', numero: 3911 },
    { ejercicio: 2025, serie: 'A', numero: 3917 },
    { ejercicio: 2025, serie: 'A', numero: 3966 },
    { ejercicio: 2025, serie: 'A', numero: 3967 },
    { ejercicio: 2025, serie: 'A', numero: 3990 },
    { ejercicio: 2025, serie: 'A', numero: 4002 },
    { ejercicio: 2025, serie: 'A', numero: 4052 },
    { ejercicio: 2025, serie: 'A', numero: 4062 },
    { ejercicio: 2025, serie: 'A', numero: 4063 },
    { ejercicio: 2025, serie: 'A', numero: 4121 },
    { ejercicio: 2025, serie: 'A', numero: 4125 },
    { ejercicio: 2025, serie: 'A', numero: 4126 },
    { ejercicio: 2025, serie: 'A', numero: 4162 },
    { ejercicio: 2025, serie: 'A', numero: 4188 },
    { ejercicio: 2025, serie: 'A', numero: 4209 },
    { ejercicio: 2025, serie: 'A', numero: 4210 },
    { ejercicio: 2025, serie: 'A', numero: 4246 },
    { ejercicio: 2025, serie: 'A', numero: 4247 },
    { ejercicio: 2025, serie: 'A', numero: 4248 },
    { ejercicio: 2025, serie: 'A', numero: 4296 },
    { ejercicio: 2025, serie: 'A', numero: 4297 },
    { ejercicio: 2025, serie: 'A', numero: 4337 },
    { ejercicio: 2025, serie: 'A', numero: 4339 },
    { ejercicio: 2025, serie: 'A', numero: 4340 },
    { ejercicio: 2025, serie: 'A', numero: 4396 },
    { ejercicio: 2025, serie: 'A', numero: 4397 },
    { ejercicio: 2025, serie: 'A', numero: 4414 },
    { ejercicio: 2025, serie: 'A', numero: 4418 },
    { ejercicio: 2025, serie: 'A', numero: 4485 },
    { ejercicio: 2025, serie: 'A', numero: 4487 },
    { ejercicio: 2025, serie: 'A', numero: 4488 },
    { ejercicio: 2025, serie: 'A', numero: 4489 },
    { ejercicio: 2025, serie: 'A', numero: 4512 },
    { ejercicio: 2025, serie: 'A', numero: 4513 },
    { ejercicio: 2025, serie: 'A', numero: 4527 },
    { ejercicio: 2025, serie: 'A', numero: 4528 },
    { ejercicio: 2025, serie: 'A', numero: 4543 },
    { ejercicio: 2025, serie: 'A', numero: 4583 },
    { ejercicio: 2025, serie: 'A', numero: 4584 },
    { ejercicio: 2025, serie: 'A', numero: 4586 },
    { ejercicio: 2025, serie: 'A', numero: 4587 },
    { ejercicio: 2025, serie: 'A', numero: 4641 },
    { ejercicio: 2025, serie: 'A', numero: 4659 },
    { ejercicio: 2025, serie: 'A', numero: 4666 },
    { ejercicio: 2025, serie: 'A', numero: 4668 },
    { ejercicio: 2025, serie: 'A', numero: 4672 },
    { ejercicio: 2025, serie: 'A', numero: 4691 },
    { ejercicio: 2025, serie: 'A', numero: 4716 },
    { ejercicio: 2025, serie: 'A', numero: 4721 },
    { ejercicio: 2025, serie: 'A', numero: 4727 },
    { ejercicio: 2025, serie: 'A', numero: 4742 },
    { ejercicio: 2025, serie: 'A', numero: 4754 },
    { ejercicio: 2025, serie: 'A', numero: 4808 },
    { ejercicio: 2025, serie: 'A', numero: 4811 },
    { ejercicio: 2025, serie: 'A', numero: 4842 },
    { ejercicio: 2025, serie: 'A', numero: 4871 },
    { ejercicio: 2025, serie: 'A', numero: 4888 },
    { ejercicio: 2025, serie: 'A', numero: 4904 },
    { ejercicio: 2025, serie: 'A', numero: 4914 },
    { ejercicio: 2025, serie: 'A', numero: 4929 },
    { ejercicio: 2025, serie: 'A', numero: 4958 },
    { ejercicio: 2025, serie: 'A', numero: 4962 },
    { ejercicio: 2025, serie: 'A', numero: 5005 },
    { ejercicio: 2025, serie: 'A', numero: 5008 },
    { ejercicio: 2025, serie: 'A', numero: 5061 },
    { ejercicio: 2025, serie: 'A', numero: 5067 },
    { ejercicio: 2025, serie: 'A', numero: 5078 },
    { ejercicio: 2025, serie: 'A', numero: 5140 },
    { ejercicio: 2025, serie: 'A', numero: 5143 },
    { ejercicio: 2025, serie: 'A', numero: 5166 },
    { ejercicio: 2025, serie: 'A', numero: 5167 },
    { ejercicio: 2025, serie: 'A', numero: 5212 },
    { ejercicio: 2025, serie: 'A', numero: 5227 },
    { ejercicio: 2025, serie: 'A', numero: 5243 },
    { ejercicio: 2025, serie: 'A', numero: 5264 },
    { ejercicio: 2025, serie: 'A', numero: 5272 },
    { ejercicio: 2025, serie: 'A', numero: 5277 },
    { ejercicio: 2025, serie: 'A', numero: 5286 },
    { ejercicio: 2025, serie: 'A', numero: 5287 },
    { ejercicio: 2025, serie: 'A', numero: 5314 },
    { ejercicio: 2025, serie: 'A', numero: 5316 },
    { ejercicio: 2025, serie: 'A', numero: 5374 },
    { ejercicio: 2025, serie: 'A', numero: 5385 },
    { ejercicio: 2025, serie: 'A', numero: 5413 },
    { ejercicio: 2025, serie: 'A', numero: 5414 },
    { ejercicio: 2025, serie: 'A', numero: 5416 },
    { ejercicio: 2025, serie: 'A', numero: 5437 },
    { ejercicio: 2025, serie: 'A', numero: 5442 },
    { ejercicio: 2025, serie: 'A', numero: 5476 },
    { ejercicio: 2025, serie: 'A', numero: 5478 },
    { ejercicio: 2025, serie: 'A', numero: 5526 },
    { ejercicio: 2025, serie: 'A', numero: 5531 },
    { ejercicio: 2025, serie: 'A', numero: 5580 },
    { ejercicio: 2025, serie: 'A', numero: 5631 },
    { ejercicio: 2025, serie: 'A', numero: 5656 },
    // NOTA: NO hay agosto (mes 8) - salta de julio a septiembre
    { ejercicio: 2025, serie: 'A', numero: 6958 },
    { ejercicio: 2025, serie: 'A', numero: 6960 },
    { ejercicio: 2025, serie: 'A', numero: 6995 },
    { ejercicio: 2025, serie: 'A', numero: 6996 },
    { ejercicio: 2025, serie: 'A', numero: 6997 },
    { ejercicio: 2025, serie: 'A', numero: 7033 },
    { ejercicio: 2025, serie: 'A', numero: 7034 },
    { ejercicio: 2025, serie: 'A', numero: 7049 },
    { ejercicio: 2025, serie: 'A', numero: 7050 },
    { ejercicio: 2025, serie: 'A', numero: 7109 },
    { ejercicio: 2025, serie: 'A', numero: 7149 },
    { ejercicio: 2025, serie: 'A', numero: 7165 },
    { ejercicio: 2025, serie: 'A', numero: 7167 },
    { ejercicio: 2025, serie: 'A', numero: 7182 },
    { ejercicio: 2025, serie: 'A', numero: 7237 },
    { ejercicio: 2025, serie: 'A', numero: 7240 },
    { ejercicio: 2025, serie: 'A', numero: 7245 },
    { ejercicio: 2025, serie: 'A', numero: 7285 },
    { ejercicio: 2025, serie: 'A', numero: 7323 },
    { ejercicio: 2025, serie: 'A', numero: 7327 },
    { ejercicio: 2025, serie: 'A', numero: 7338 },
    { ejercicio: 2025, serie: 'A', numero: 7339 },
    { ejercicio: 2025, serie: 'A', numero: 7341 },
    { ejercicio: 2025, serie: 'A', numero: 7342 },
    { ejercicio: 2025, serie: 'A', numero: 7370 },
    { ejercicio: 2025, serie: 'A', numero: 7407 },
    { ejercicio: 2025, serie: 'A', numero: 7451 },
    { ejercicio: 2025, serie: 'A', numero: 7492 },
    { ejercicio: 2025, serie: 'A', numero: 7498 },
    { ejercicio: 2025, serie: 'A', numero: 7551 },
    { ejercicio: 2025, serie: 'A', numero: 7601 },
    { ejercicio: 2025, serie: 'A', numero: 7647 },
    { ejercicio: 2025, serie: 'A', numero: 7660 },
    { ejercicio: 2025, serie: 'A', numero: 7692 },
    { ejercicio: 2025, serie: 'A', numero: 7701 },
    { ejercicio: 2025, serie: 'A', numero: 7736 },
    { ejercicio: 2025, serie: 'A', numero: 7756 },
    { ejercicio: 2025, serie: 'A', numero: 7765 },
    { ejercicio: 2025, serie: 'A', numero: 7801 },
    { ejercicio: 2025, serie: 'A', numero: 7810 },
    { ejercicio: 2025, serie: 'A', numero: 7845 },
    { ejercicio: 2025, serie: 'A', numero: 7917 },
    { ejercicio: 2025, serie: 'A', numero: 7952 },
    { ejercicio: 2025, serie: 'A', numero: 7959 },
    { ejercicio: 2025, serie: 'A', numero: 8015 },
    { ejercicio: 2025, serie: 'A', numero: 8071 },
    { ejercicio: 2025, serie: 'A', numero: 8115 },
    { ejercicio: 2025, serie: 'A', numero: 8155 },
    { ejercicio: 2025, serie: 'A', numero: 8229 },
    { ejercicio: 2025, serie: 'A', numero: 8277 },
    { ejercicio: 2025, serie: 'A', numero: 8299 },
    { ejercicio: 2025, serie: 'A', numero: 8403 },
    { ejercicio: 2025, serie: 'A', numero: 8418 },
    { ejercicio: 2025, serie: 'A', numero: 8446 },
    { ejercicio: 2025, serie: 'A', numero: 8512 },
    { ejercicio: 2025, serie: 'A', numero: 8565 },
    { ejercicio: 2025, serie: 'A', numero: 8581 },
    { ejercicio: 2025, serie: 'A', numero: 8671 },
    { ejercicio: 2025, serie: 'A', numero: 8739 },
    { ejercicio: 2025, serie: 'A', numero: 8820 },
    { ejercicio: 2025, serie: 'A', numero: 8861 },
    { ejercicio: 2025, serie: 'A', numero: 8940 },
    { ejercicio: 2025, serie: 'A', numero: 8945 },
    { ejercicio: 2025, serie: 'A', numero: 9015 },
    { ejercicio: 2025, serie: 'A', numero: 9077 },
    { ejercicio: 2025, serie: 'A', numero: 9114 },
    // Serie F
    { ejercicio: 2025, serie: 'F', numero: 7370 },
    { ejercicio: 2025, serie: 'F', numero: 11500 },
];

// Crear set de claves para búsqueda rápida
const refSet = new Set(FACTURAS_REFERENCIA.map(f => `${f.serie}-${f.numero}`));

console.log(`Facturas en referencia: ${FACTURAS_REFERENCIA.length}`);
console.log(`  Serie A: ${FACTURAS_REFERENCIA.filter(f => f.serie === 'A').length}`);
console.log(`  Serie F: ${FACTURAS_REFERENCIA.filter(f => f.serie === 'F').length}`);

async function compararFacturas() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  COMPARAR FACTURAS: NUESTRAS vs REFERENCIA                      ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // Obtener nuestras facturas
        const queryNuestras = `
      SELECT DISTINCT
        TRIM(C.SERIEFACTURA) as SERIE,
        C.NUMEROFACTURA as NUMERO,
        C.EJERCICIOFACTURA as EJERCICIO,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE3 + C.IMPORTEBASEIMPONIBLE5) as BASE
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND TRIM(C.SERIEFACTURA) IN ('A', 'F')
      GROUP BY TRIM(C.SERIEFACTURA), C.NUMEROFACTURA, C.EJERCICIOFACTURA
      ORDER BY TRIM(C.SERIEFACTURA), C.NUMEROFACTURA
    `;

        const nuestras = await pool.query(queryNuestras);
        console.log(`Nuestras facturas: ${nuestras.length}`);
        console.log(`  Serie A: ${nuestras.filter(f => f.SERIE === 'A').length}`);
        console.log(`  Serie F: ${nuestras.filter(f => f.SERIE === 'F').length}`);

        // Encontrar las que están en nuestras pero NO en referencia
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('FACTURAS QUE NOSOTROS TENEMOS Y LA REFERENCIA NO:');
        console.log('═══════════════════════════════════════════════════════════════\n');

        let sumaExtra = 0;
        let countExtra = 0;

        nuestras.forEach(f => {
            const key = `${f.SERIE}-${f.NUMERO}`;
            if (!refSet.has(key)) {
                const base = parseFloat(f.BASE) || 0;
                sumaExtra += base;
                countExtra++;
                console.log(`  ${f.EJERCICIO}-${f.SERIE}-${String(f.NUMERO).padStart(6, '0')}: Base=${base.toFixed(2)}€`);
            }
        });

        console.log(`\nTotal facturas extra: ${countExtra}`);
        console.log(`Suma de base extra: ${sumaExtra.toFixed(2)}€`);
        console.log(`Diferencia esperada: 175.11€`);

        // Encontrar las que están en referencia pero NO en nuestras
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('FACTURAS QUE LA REFERENCIA TIENE Y NOSOTROS NO:');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const nuestrasSet = new Set(nuestras.map(f => `${f.SERIE}-${f.NUMERO}`));
        let countFaltan = 0;

        FACTURAS_REFERENCIA.forEach(f => {
            const key = `${f.serie}-${f.numero}`;
            if (!nuestrasSet.has(key)) {
                countFaltan++;
                console.log(`  ${f.ejercicio}-${f.serie}-${String(f.numero).padStart(6, '0')}`);
            }
        });

        console.log(`\nTotal facturas faltantes: ${countFaltan}`);

        console.log('\n✓ Comparación completada\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
    } finally {
        if (pool) {
            await pool.close();
            console.log('✓ Pool cerrado\n');
        }
    }
}

compararFacturas().catch(console.error);
