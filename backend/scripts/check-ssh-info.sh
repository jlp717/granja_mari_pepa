#!/bin/bash

# Script para obtener información del sistema SSH
# Ejecutar este script una vez conectado por SSH

echo "========================================="
echo "INFORMACIÓN DEL SISTEMA"
echo "========================================="
echo ""

echo "Usuario actual:"
whoami
echo ""

echo "Directorio home:"
pwd
echo ""

echo "Sistema operativo:"
cat /etc/os-release | grep "PRETTY_NAME" | cut -d'"' -f2
echo ""

echo "Versión SSH:"
ssh -V 2>&1
echo ""

echo "Usuarios del sistema con shell:"
cat /etc/passwd | grep -v "nologin" | grep -v "false" | cut -d: -f1
echo ""

echo "Grupos del usuario actual:"
groups
echo ""

echo "========================================="
