# Manual Completo de Usuario y Guía de Producción — Administrador Financiero Personal

Bienvenido al **Manual Oficial de Usuario y Administración** de **Administrador Financiero Personal (Calendario Financiero PWA)**. Este documento explica a detalle cada sección de la aplicación, cómo funcionan sus cálculos y proyecciones financieras, cómo configurar el **Inicio de Sesión con Google (OAuth 2.0)** paso a paso, y las implicaciones de arquitectura para producción multiusuario.

---

## Índice

1. [Propósito General de la Aplicación](#1-propósito-general-de-la-aplicación)
2. [Acceso, Registro y Plataforma Multiusuario](#2-acceso-registro-y-plataforma-multiusuario)
3. [Configuración Inicial para Nuevos Usuarios (Onboarding en 5 Pasos)](#3-configuración-inicial-para-nuevos-usuarios-onboarding-en-5-pasos)
4. [Calendario Financiero Mensual (Pantalla de Inicio)](#4-calendario-financiero-mensual-pantalla-de-inicio)
5. [Fórmulas Financieras: Saldo Actual vs. Saldo Proyectado y Fecha de Corte](#5-fórmulas-financieras-saldo-actual-vs-saldo-proyectado-y-fecha-de-corte)
6. [Registro, Detalle y Confirmación de Movimientos (Gastos e Ingresos)](#6-registro-detalle-y-confirmación-de-movimientos-gastos-e-ingresos)
7. [Presupuesto Mensual, Tramo hasta Próximo Ingreso y Punto Más Bajo](#7-presupuesto-mensual-tramo-hasta-próximo-ingreso-y-punto-más-bajo)
8. [Reglas Recurrentes y Alcance de Edición](#8-reglas-recurrentes-y-alcance-de-edición)
9. [Categorías, Geometrías de Prioridad y Modo Oscuro](#9-categorías-geometrías-de-prioridad-y-modo-oscuro)
10. [Guía Paso a Paso: Cómo Obtener el Código de Proyecto en Google Cloud y Activar Google Login en Supabase](#10-guía-paso-a-paso-cómo-obtener-el-código-de-proyecto-en-google-cloud-y-activar-google-login-en-supabase)
11. [Implicaciones de Producción Implementadas](#11-implicaciones-de-producción-implementadas)

---

## 1. Propósito General de la Aplicación

A diferencia de las aplicaciones tradicionales que solo registran lo que ya gastaste en el pasado, **Administrador Financiero Personal** funciona como un **Calendario de Liquidez Futura**. Su objetivo es responder en menos de 5 segundos a tres preguntas clave:

1. **¿Cuánto dinero real tengo hoy en mi cuenta?** (`Saldo Actual`)
2. **¿Con cuánto dinero cerraré el mes después de pagar todos mis recibos y cobrar mis ingresos?** (`Saldo Proyectado Fin de Mes`)
3. **¿En qué día del mes mi dinero llegará a su nivel más bajo y cuánto margen tendré antes de mi próxima quincena?** (`Punto Más Bajo del Mes`)

---

## 2. Acceso, Registro y Plataforma Multiusuario

La aplicación está diseñada como una **plataforma multiusuario en la nube (SaaS)**:
- Cualquier persona puede crear su propia cuenta con **Correo y Contraseña** o mediante **Continuar con Google**.
- Al registrarse un usuario nuevo, la base de datos en **Supabase (PostgreSQL)** ejecuta automáticamente un disparador (`private.handle_new_user`) y una función de aprovisionamiento (`public.ensure_user_workspace`) que crean:
  - Su perfil en `public.users`.
  - Su espacio de trabajo privado (`public.workspaces`) y membresía (`public.workspace_members`).
  - Su cuenta líquida principal (`public.accounts`) en pesos mexicanos (`MXN`).
  - Sus **11 categorías predeterminadas** (`Vivienda / Renta`, `Servicios del hogar`, `Supermercado y despensa`, `Transporte y gasolina`, `Salud y farmacia`, `Deudas y créditos`, `Educación`, `Suscripciones`, `Comidas fuera y ocio`, `Nómina / Sueldo`, `Ingresos independientes`).
  - Su presupuesto mensual base (`public.budgets`).
- **Aislamiento total (Row-Level Security)**: Mediante políticas RLS con función `private.is_workspace_member(workspace_id)`, ningún usuario puede ver ni modificar movimientos, presupuestos o categorías de otro usuario.

---

## 3. Configuración Inicial para Nuevos Usuarios (Onboarding en 5 Pasos)

Cuando un usuario ingresa por primera vez, la aplicación lo guía paso a paso explicándole qué es cada dato y para qué le sirve:

1. **Paso 1 — Saldo inicial disponible y Fecha de corte**:
   - **Qué ingresar**: El dinero líquido real que tienes hoy sumando tu cuenta de débito/nómina y tu efectivo disponible (ej. `$6,480.50`).
   - **Fecha de corte**: El día a partir del cual se toma esa fotografía de tu dinero. Sirve para evitar el doble conteo si después decides registrar pagos históricos ocurridos antes de esa fecha.
2. **Paso 2 — Presupuesto mensual (Techo de gasto)**:
   - **Qué ingresar**: El monto máximo que deseas permitirte gastar durante todo el mes (ej. `$20,000.00`), junto con tu porcentaje de alerta preventiva (ej. `80%`) y tu colchón mínimo de seguridad (ej. `10%`).
3. **Paso 3 — Categorías y prioridades**:
   - Te muestra las categorías incluidas y cómo cada una sugiere automáticamente una prioridad (**Esencial**, **Importante** o **Flexible**).
4. **Paso 4 — Tus ingresos del mes**:
   - **Qué ingresar**: Tu sueldo, quincena, pensión o cobros recurrentes (puedes elegir frecuencia **Quincenal — días 15 y último** o **Mensual**).
5. **Paso 5 — Tus gastos fijos y recibos**:
   - **Qué ingresar**: Tus compromisos obligatorios como renta, hipoteca, luz CFE, internet, colegiaturas o suscripciones. Puedes marcarlos como **Monto Fijo (`$`)** o **Monto Variable (`~$`)**.

Al finalizar el Paso 5, se abre automáticamente el **Tutorial Interactivo de Bienvenida** (que también puedes volver a abrir en cualquier momento desde el botón superior **Tutorial**).

---

## 4. Calendario Financiero Mensual (Pantalla de Inicio)

La pantalla principal **Inicio** se divide en tres zonas diseñadas para usarse con una sola mano en teléfono móvil:

1. **Tarjeta de Resumen Financiero (Colapsable al hacer scroll)**:
   - Muestra tu **Saldo Actual**, tu **Saldo Proyectado a Fin de Mes**, el **Semáforo de Salud Financiera** (`Proyección saludable` en verde, `Colchón ajustado` o `Proyección parcial` en ámbar, `Riesgo de déficit` en rojo), los totales de **Ingresos recibidos vs. programados**, **Gastos pagados vs. pendientes** y la barra rápida de tu **Presupuesto Mensual**.
2. **Cuadrícula Mensual (Lunes a Domingo)**:
   - Cada día muestra hasta 3 marcadores geométricos indicando qué tipo de compromisos caen en esa fecha:
     - **Punto verde**: Ingreso esperado o recibido.
     - **Círculo sólido (`●`)**: Gasto **Esencial** (obligatorio e impostergable).
     - **Diamante (`◆`)**: Gasto **Importante** (necesario pero ajustable).
     - **Círculo hueco (`○`)**: Gasto **Flexible** (discrecional, ocio o suscripciones).
     - **Palomita verde (`✓`)**: Todos los movimientos de ese día ya fueron confirmados como **Pagados** o **Recibidos** (nunca desaparecen del calendario al confirmarse).
   - Al tocar cualquier día del calendario, se abre la hoja inferior **Detalle del Día**, donde ves tanto los pendientes como los ya confirmados en esa fecha (o en su fecha originalmente programada).
3. **Por pagar o cobrar vs. Confirmados este mes**:
   - Debajo del calendario encontrarás primero tus compromisos **Por pagar o cobrar** con botones directos de **Confirmar pago** o **Confirmar cobro**, y enseguida la sección **Confirmados este mes**, para que cualquier gasto que marques como pagado siga visible en tu pantalla principal.

---

## 5. Fórmulas Financieras: Saldo Actual vs. Saldo Proyectado y Fecha de Corte

### Formato de Cantidades
Todas las cifras monetarias y campos de captura aplican formato automático con **comas cada 3 dígitos** y **punto para separar los centavos** (`$12,345.67`).

### Saldo Actual
Representa el dinero real que tienes hoy en tu bolsillo o cuenta:
$$\text{Saldo Actual} = \text{Saldo Inicial} + \text{Ingresos Recibidos Posteriores al Corte} - \text{Gastos Pagados Posteriores al Corte}$$

### Regla de Fecha de Corte (Anti Doble Conteo)
Si registras un gasto ya pagado o un ingreso ya recibido cuya fecha real (`settled_date`) es **anterior** a tu fecha de corte del saldo inicial (`opening_balance_date`), la aplicación muestra un aviso informativo azul indicando que dicho movimiento **sí se suma a tus estadísticas del mes y a tu presupuesto**, pero **no altera tu Saldo Actual**, pues ese dinero ya había entrado o salido antes de que declararas tu saldo inicial.

### Saldo Proyectado de Fin de Mes
$$\text{Saldo Proyectado} = \text{Saldo Actual} + \text{Ingresos Programados Vigentes} - \text{Gastos Pendientes y Vencidos}$$

- **Protección ante Ingresos Atrasados**: Si un ingreso programado llega a su fecha esperada y aún no lo has confirmado como recibido (`expected_date < Hoy`), pasa a estado **Atrasado**. Por prudencia financiera, el motor **no lo suma al Saldo Proyectado** hasta que confirmes que el dinero realmente entró a tu cuenta o lo reprogrames a una nueva fecha futura.
- **Gastos Vencidos**: Si un gasto pendiente pasa de su fecha de vencimiento sin haberse pagado, se marca como **Vencido** (alerta roja) y **sigue restando** en tu proyección porque la obligación de pago continúa vigente.

---

## 6. Registro, Detalle y Confirmación de Movimientos (Gastos e Ingresos)

### Botón Central `+ Nuevo`: ¿Programado o Recibido? ¿Pendiente o Pagado?
Al registrar un movimiento eliges si es a futuro o ya ocurrió en tu cuenta:

| Tipo | Estado futuro (aún no ocurre) | Estado liquidado (ya ocurrió) |
| :--- | :--- | :--- |
| **Ingreso** | **Programado (Aún no entra)**: Úsalo para quincenas futuras, bonos o pagos que esperas cobrar después. **No cambia tu Saldo Actual hoy**, pero sí se contempla en tu **Saldo Proyectado** de fin de mes. | **Recibido (Ya entró a tu cuenta)**: Úsalo cuando el dinero ya te cayó o lo tienes en efectivo hoy/antes. **Suma de inmediato a tu Saldo Actual** (salvo fechas previas a tu corte inicial). |
| **Gasto** | **Pendiente (Por pagar después)**: Úsalo para recibos, renta o mensualidades futuras. No resta de tu Saldo Actual hoy, pero se aparta en tu Proyección y Presupuesto. | **Pagado (Ya salió el dinero)**: Úsalo para compras o recibos ya liquidados. **Descuenta de inmediato tu Saldo Actual** y queda visible como Pagado en el calendario. |

> **Consejo rápido:** Si todavía no tienes el dinero en el banco o aún no pagas el recibo, usa siempre **Programado** (para ingresos) o **Pendiente** (para gastos), y confírmalo cuando llegue el día.

### Monto Fijo (`$`) vs. Monto Variable (`~$`) y "Monto por definir"
- **Fijo (`$`)**: Conoces la cantidad exacta (ej. Renta `$8,500.00` o Netflix `$249.00`).
- **Variable (`~$`)**: Es un estimado que puede variar al llegar el recibo (ej. Luz CFE `~$650.00`). Si aún no tienes idea del monto, puedes dejarlo en `0.00` y el calendario mostrará una alerta ámbar de **Proyección parcial (Monto por definir)**.

### Confirmar Pago o Recepción ("Así cambiará tu panorama")
Al confirmar que ya pagaste un recibo o ya cobraste un ingreso:
- Puedes escribir el **Monto Real** definitivo (por ejemplo, habías estimado `~$650.00` de luz pero pagaste `$680.00`).
- La tarjeta interactiva **"Así cambiará tu panorama al confirmar"** te muestra en tiempo real cómo quedará tu Saldo Actual, tu Saldo Proyectado y tu Presupuesto Disponible antes de guardar.
- En el **Detalle de Movimiento**, la tarjeta **Comparativa: Estimado vs. Real** conserva para siempre cuánto habías planeado y cuánto pagaste realmente, junto con la bitácora de auditoría.

---

## 7. Presupuesto Mensual, Tramo hasta Próximo Ingreso y Punto Más Bajo

En la pestaña **Presupuesto** de la barra inferior encontrarás cuatro herramientas de control:
1. **Anillo de Presupuesto Usado y Barra Segmentada**: Divide tu techo mensual en tres partes claras: **Pagado** (verde bosque), **Pendiente por pagar** (salvia) y **Disponible** (margen libre).
2. **Comparativa Cuenta vs. Presupuesto**: Te permite distinguir cuánto dinero real tendrás en el banco a fin de mes frente a cuánto margen te queda dentro del límite de gasto que tú mismo te impusiste.
3. **Tramo "Hasta tu próximo ingreso"**: Calcula cuántos días faltan para tu siguiente cobro (ej. tu próxima quincena), cuántos pagos debes cubrir antes de esa fecha y con cuánto saldo llegarás el día previo a cobrar.
4. **Punto Más Bajo del Mes**: Recorre día por día tu curva de saldo proyectado y te dice exactamente en qué fecha del mes tendrás menos dinero disponible, verificando que nunca bajes de tu **Colchón Mínimo de Seguridad**.

---

## 8. Reglas Recurrentes y Alcance de Edición

En **Más → Reglas recurrentes** puedes administrar todos tus pagos y cobros automáticos (`Semanal`, `Cada 2 semanas`, `Quincenal 15 y último`, `Mensual`, `Bimestral`, `Trimestral`, `Semestral`, `Anual`).

Cuando editas el monto o título de un movimiento que pertenece a una regla recurrente, el sistema te permite elegir el **Alcance de Edición**:
- **Solo este movimiento**: Crea una excepción única para este mes sin alterar los meses futuros.
- **Este y los siguientes**: Actualiza este movimiento y las ocurrencias futuras pendientes.
- **Todos los pendientes**: Actualiza todas las ocurrencias aún no liquidadas.
- **Protección de historial**: Los pagos o cobros que ya confirmaste como liquidados en el pasado están bloqueados con candado y **nunca se alteran** al modificar una regla recurrente.

---

## 9. Categorías, Geometrías de Prioridad y Modo Oscuro

- **Accesibilidad sin depender solo del color**: Todas las prioridades combinan color, etiqueta en español y una **forma geométrica distinta** (`●` Círculo para Esencial, `◆` Diamante para Importante, `▲` Triángulo para Flexible).
- **Desactivación lógica de categorías**: Si dejas de usar una categoría en **Más → Categorías**, puedes desactivarla sin perder ni alterar tus movimientos históricos asociados a ella.
- **Modo Oscuro ("Modo Oscuro / Claro")**: En la barra superior derecha (y también en **Más → Apariencia**) puedes alternar instantáneamente entre la paleta **Editorial Cálida Clara** y el **Modo Oscuro de Alto Contraste**, guardándose tu preferencia automáticamente.

---

## 10. Guía Paso a Paso: Cómo Obtener el Código de Proyecto en Google Cloud y Activar Google Login en Supabase

El botón **"Continuar con Google" / "Iniciar sesión con Google"** ya está programado en la aplicación (`supabase.auth.signInWithOAuth({ provider: "google" })`) junto con su ruta de retorno `/auth/callback`. Para que Google autorice el inicio de sesión, solo necesitas generar tu **Client ID** y **Client Secret** en **Google Cloud Console** y pegarlos en tu panel de **Supabase** siguiendo estos 5 pasos:

### Paso 1: Crear o seleccionar tu proyecto en Google Cloud Console
1. Entra a [https://console.cloud.google.com/](https://console.cloud.google.com/) con tu cuenta de Google.
2. En la parte superior izquierda (junto al logo de Google Cloud), haz clic en el selector de proyectos y pulsa **"Proyecto nuevo" (New Project)**.
3. Asígnale un nombre como `Administrador Financiero Personal` y haz clic en **Crear**.

### Paso 2: Configurar la Pantalla de Consentimiento OAuth (OAuth Consent Screen)
1. En el menú lateral izquierdo de Google Cloud Console, ve a **APIs y servicios (APIs & Services) → Pantalla de consentimiento de OAuth (OAuth consent screen)** (o **Google Auth Platform → Overview** en la nueva interfaz).
2. Selecciona el tipo de usuario **Externo (External)** para que cualquier usuario con cuenta de Google pueda registrarse en tu plataforma, y haz clic en **Crear**.
3. Completa los datos básicos obligatorios:
   - **Nombre de la aplicación**: `Administrador Financiero Personal`
   - **Correo electrónico de asistencia del usuario**: Tu correo electrónico.
   - **Información de contacto del desarrollador**: Tu correo electrónico.
4. Haz clic en **Guardar y continuar** en los pasos de Permisos (Scopes) y Usuarios de prueba, y en el resumen final pulsa **Publicar aplicación (Publish App)** para que quede en estado *En producción* y cualquier usuario pueda iniciar sesión sin restricciones.

### Paso 3: Crear las Credenciales OAuth 2.0 (Client ID y Client Secret)
1. En el menú izquierdo de Google Cloud Console, ve a **APIs y servicios → Credenciales (Credentials)**.
2. En la barra superior, haz clic en **+ Crear credenciales (+ Create Credentials) → ID de cliente de OAuth (OAuth client ID)**.
3. En **Tipo de aplicación (Application type)**, elige **Aplicación web (Web application)**.
4. En **Nombre**, escribe `Supabase Auth Web Client`.
5. En la sección **Orígenes de JavaScript autorizados (Authorized JavaScript origins)**, agrega:
   - `http://localhost:3000` (para tus pruebas locales)
   - El dominio de producción donde publiques tu app (ej. `https://tu-dominio.vercel.app`)
   - `https://beqpktixfijdzjdtrxsz.supabase.co`
6. En la sección **URI de redireccionamiento autorizados (Authorized redirect URIs)**, pega exactamente la URL de callback de tu proyecto de Supabase:
   ```text
   https://beqpktixfijdzjdtrxsz.supabase.co/auth/v1/callback
   ```
7. Haz clic en **Crear (Create)**.
8. Google te mostrará una ventana con dos códigos:
   - **ID de cliente (Client ID)**: (termina en `.apps.googleusercontent.com`)
   - **Secreto del cliente (Client Secret)**: (código alfanumérico que empieza con `GOCSPX-...`)
   ¡Copia ambos valores!

### Paso 4: Pegar los códigos en tu Proyecto de Supabase
1. Abre tu panel de Supabase en:
   [https://supabase.com/dashboard/project/beqpktixfijdzjdtrxsz/auth/providers](https://supabase.com/dashboard/project/beqpktixfijdzjdtrxsz/auth/providers)
2. En la lista de **Auth Providers**, busca **Google** y despliega su sección.
3. Activa el interruptor **Enable Sign in with Google**.
4. Pega el **Client ID (for OAuth)** y el **Client Secret (for OAuth)** que copiaste en el Paso 3.
5. Haz clic en **Save (Guardar)**.

### Paso 5: Configurar las URLs de Redirección de tu Sitio en Supabase
1. En el mismo panel de Supabase, ve a **Authentication → URL Configuration**:
   [https://supabase.com/dashboard/project/beqpktixfijdzjdtrxsz/auth/url-configuration](https://supabase.com/dashboard/project/beqpktixfijdzjdtrxsz/auth/url-configuration)
2. En **Site URL**, coloca la dirección principal de tu aplicación (en desarrollo `http://localhost:3000`, o en producción `https://tu-app.vercel.app`).
3. En **Redirect URLs**, haz clic en **Add URL** y agrega:
   - `http://localhost:3000/auth/callback`
   - `https://tu-app.vercel.app/auth/callback` (cuando despliegues en producción)
4. Guarda los cambios. ¡El botón **Continuar con Google** funcionará de inmediato!

---

## 11. Implicaciones de Producción Implementadas

Además de los puntos solicitados, se analizaron y resolvieron las siguientes implicaciones críticas para que la aplicación opere en producción sin inconvenientes:

1. **Fecha Real Dinámica en Zona Horaria de México (`America/Mexico_City`)**: Se reemplazó la fecha fija de demostración por `getTodayMexicoCity()`, de modo que el calendario, el día marcado como "Hoy", los vencimientos y los cortes calculen sobre la fecha real del usuario.
2. **Aprovisionamiento Multiusuario Automático en Base de Datos**: La migración `0002_multiuser_production_provisioning.sql` garantiza que cada cuenta nueva (registrada por correo o por Google OAuth) reciba su propio espacio de trabajo aislado (`workspace`), cuenta líquida en `MXN`, presupuesto inicial y catálogo de 11 categorías sin intervención manual.
3. **Base de Datos Limpia (0 registros de prueba)**: Se eliminaron por completo los datos semilla de demostración para que el entorno de producción inicie limpio y listo para recibir usuarios reales.
4. **Alertas de Vencidos y Atrasados 100% Dinámicas**: Los avisos superiores del calendario ahora iteran dinámicamente sobre las transacciones reales vencidas o atrasadas de cada usuario.
5. **Ruta `/auth/callback` para OAuth y Recuperación de Contraseña**: Implementada en `src/app/auth/callback/page.tsx` para intercambiar el código PKCE de Google Auth o enlaces de recuperación de contraseña y redirigir limpiamente al calendario del usuario.
6. **Eliminación de Movimientos y Reglas Recurrentes**: Además de cancelar o pausar, el usuario cuenta ahora con la opción de eliminar permanentemente movimientos o reglas recurrentes creadas por error.
