"use client";

import React, { useEffect, useState } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import type { ScreenId } from "@/lib/finance/types";
import {
  useBottomSheetDragToDismiss,
  useHorizontalSwipe,
} from "@/lib/hooks/useSwipeGesture";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Info,
  Lightbulb,
  PieChart,
  PlusCircle,
  Repeat,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";

interface TutorialElementGuide {
  id: string;
  label: string;
  shortTag: string;
  whatIs: string;
  whatFor: string;
  howToUse: string;
  example: string;
}

interface TutorialPhase {
  step: number;
  shortLabel: string;
  badge: string;
  title: string;
  intro: string;
  targetScreen?: ScreenId;
  targetLabel?: string;
  elements: TutorialElementGuide[];
}

const INTERACTIVE_TUTORIAL_PHASES: TutorialPhase[] = [
  {
    step: 1,
    shortLabel: "Panorama",
    badge: "Fase 1 de 7 • Panel superior",
    title: "Tu Panorama Financiero y Proyección del Mes",
    intro:
      "En la parte superior de la pantalla principal ves el resumen completo de tu mes. Toca cualquiera de estos 5 elementos para entender qué es y para qué te sirve:",
    targetScreen: "P10",
    targetLabel: "Ir al Calendario y ver mi Panorama",
    elements: [
      {
        id: "saldo-actual",
        label: "Saldo actual",
        shortTag: "Dinero hoy",
        whatIs:
          "Es el dinero líquido real que tienes disponible hoy mismo en tu cuenta principal y efectivo, partiendo de tu saldo inicial más los ingresos ya recibidos menos los gastos ya pagados desde tu fecha de corte.",
        whatFor:
          "Te responde al instante cuánto dinero tienes en este momento sin confundirlo con dinero que ya está apartado para futuros recibos.",
        howToUse:
          "Revísalo antes de hacer una compra grande. Solo cambia cuando confirmas o registras un movimiento como Ya pagado o Ya recibido con fecha igual o posterior a tu corte.",
        example:
          "Empezaste el mes con $5,000, cobraste $1,000 hoy y pagaste $500 de luz → tu Saldo actual es $5,500.",
      },
      {
        id: "cierre-proyectado",
        label: "Cierre proyectado",
        shortTag: "Fin de mes",
        whatIs:
          "Es una estimación matemática de con cuánto dinero terminarás el mes actual una vez sumados tus ingresos programados y restados todos tus gastos pendientes por pagar.",
        whatFor:
          "Te permite detectar con semanas de anticipación si vas a cerrar con sobrante para ahorrar o si te vas a quedar corto al final del mes.",
        howToUse:
          "Si ves un número en rojo o menor al colchón deseado, toca el botón «Explicar proyección» o pospón un gasto ○ Flexible.",
        example:
          "Saldo actual $5,500 + quincena programada $8,000 − pagos pendientes $9,200 = Cierre proyectado de $4,300.",
      },
      {
        id: "semaforo",
        label: "Semáforo (Estable / Ajustado / Riesgo)",
        shortTag: "Salud del mes",
        whatIs:
          "Una insignia de color (verde Estable, ámbar Ajustado, rojo Riesgo) que evalúa tu liquidez, tu punto más bajo del mes y qué tanto te acercas a tu presupuesto.",
        whatFor:
          "Te da un diagnóstico visual en 1 segundo sin tener que hacer sumas ni restas mentales.",
        howToUse:
          "Verde: vas holgado. Ámbar: cuida tus gastos flexibles o ya superaste el 80% de tu presupuesto. Rojo: algún día del mes o el cierre cae por debajo de cero o de tu colchón.",
        example:
          "Si el día 19 tienes un cobro fuerte antes de tu quincena del 20 y tu saldo bajaría a -$300, el semáforo se pondrá en Riesgo aunque cierres el mes en positivo.",
      },
      {
        id: "explicar-proyeccion",
        label: "Botón «Explicar proyección»",
        shortTag: "Diagnóstico + consejos",
        whatIs:
          "Un asistente dentro de la tarjeta superior que desglosa operación por operación cómo salió tu Cierre proyectado y genera consejos personalizados según tu situación actual.",
        whatFor:
          "Te quita cualquier duda de «¿por qué me da ese saldo?» y te da acciones concretas para mejorar tu flujo.",
        howToUse:
          "Toca el botón «¿Cómo se calcula y qué mejorar?» debajo del cierre proyectado siempre que veas un cambio fuerte o un estado Ajustado/Riesgo.",
        example:
          "Te avisa si tienes ingresos atrasados pausados o en qué día exacto toca fondo tu cuenta este mes.",
      },
      {
        id: "corte-punto-bajo",
        label: "Fecha de corte y Punto más bajo",
        shortTag: "Sin doble conteo",
        whatIs:
          "La fecha de corte indica desde cuándo cuenta tu Saldo inicial. El punto más bajo muestra qué día del mes tu cuenta tendrá menos dinero antes de volver a recibir un ingreso.",
        whatFor:
          "Evita restar doble vez gastos que ya habías pagado antes de empezar a usar la app, y te alerta sobre baches de liquidez a mitad de mes.",
        howToUse:
          "Si ves el aviso «Corte activo» o un punto más bajo negativo en un día específico, toca ese día en el calendario para ver qué pago está causando el apretón.",
        example:
          "Tu saldo inicial es del 14 de noviembre; si anotas una comida del día 10 como historial, se guarda en Movimientos sin restarse de tu dinero de hoy.",
      },
    ],
  },
  {
    step: 2,
    shortLabel: "Calendario",
    badge: "Fase 2 de 7 • Vista diaria",
    title: "Cómo leer e interactuar con tu Calendario",
    intro:
      "Cada casilla del calendario resume lo que ocurre ese día. Toca las partes de la casilla ejemplo o los chips de abajo para descubrir qué significa cada símbolo:",
    targetScreen: "P10",
    targetLabel: "Ver mi Calendario mensual",
    elements: [
      {
        id: "cifras-dia",
        label: "Cifras + verde y − rojo",
        shortTag: "Flujo del día",
        whatIs:
          "Cada celda muestra hasta dos totales rápidos: en verde (+) lo que entra ese día y en rojo (−) lo que sale ese día.",
        whatFor:
          "Te deja ubicar de un vistazo en qué fechas caen tus quincenas y qué días concentran pagos fuertes.",
        howToUse:
          "Toca cualquier día del calendario para abrir su hoja «Detalle del día», ver cada movimiento individual y registrar nuevos pagos justo en esa fecha.",
        example:
          "Si el día 15 ves +$9,500 en verde y -$3,800 en rojo, sabes que ese día cobras pero también debes liquidar compromisos fuertes.",
      },
      {
        id: "prioridades-iconos",
        label: "Prioridades ● ◆ ○",
        shortTag: "Nivel de urgencia",
        whatIs:
          "Cada gasto tiene un símbolo y color único: ● Esencial (círculo terracota), ◆ Importante (rombo ámbar) y ○ Flexible (círculo hueco azul/oliva).",
        whatFor:
          "Cuando un mes se aprieta, sabes de inmediato qué pagos debes proteger primero (●) y cuáles puedes pausar o recortar (○).",
        howToUse:
          "Activa el interruptor «Solo pagos urgentes» arriba del calendario para esconder los gastos flexibles y concentrarte solo en ● Esenciales e ◆ Importantes.",
        example:
          "Renta e Internet llevan ● Esencial; Gasolina lleva ◆ Importante; Salidas o streaming llevan ○ Flexible.",
      },
      {
        id: "monto-aprox",
        label: "Símbolo ~ (Monto variable)",
        shortTag: "Estimado",
        whatIs:
          "La virgulilla ~ antes de una cantidad (ej. ~-$650) indica que ese monto es aproximado y todavía no conoces la cifra exacta final.",
        whatFor:
          "Te recuerda qué pagos (como luz, gas, supermercado o tarjeta) se actualizarán cuando llegue el recibo real.",
        howToUse:
          "Al confirmar el pago del recibo real, podrás capturar exactamente cuánto pagaste (por ejemplo $580 en lugar de ~$650) y la app recalculará todo.",
        example:
          "Programas tu recibo de luz en ~$650. Al pagarlo en $590, te ahorras $60 que regresan automáticamente a tu proyección.",
      },
      {
        id: "check-confirmado",
        label: "Palomita ✓ (Confirmado)",
        shortTag: "No desaparece",
        whatIs:
          "Todo movimiento que ya pagaste o ya cobraste se queda visible en su día del calendario con una insignia de confirmado (✓), además de listarse en «Confirmados este mes».",
        whatFor:
          "Conserva tu historial visual completo del mes para que siempre tengas certeza de que sí pagaste un recibo o sí recibiste un depósito.",
        howToUse:
          "Toca cualquier movimiento marcado como Pendiente/Programado en el calendario y presiona «Confirmar». Seguirá visible en su casilla con su ✓ verde.",
        example:
          "El día 5 pagas el Internet: pasa de estado «Pendiente» a «Pagado ✓» sin borrarse de la casilla 5.",
      },
      {
        id: "detalle-dia",
        label: "Hoja de Detalle del Día",
        shortTag: "Acciones del día",
        whatIs:
          "La tarjeta inferior que se abre cuando presionas cualquier cuadro del calendario o deslizas entre días.",
        whatFor:
          "Te muestra cuánto saldo acumulado llevas en ese día específico y la lista exacta de sus ingresos y gastos para editarlos o confirmarlos.",
        howToUse:
          "Toca un día del calendario, revisa sus tarjetas y usa los botones «+ Gasto aquí» o «+ Ingreso aquí» para capturar directo en esa fecha.",
        example:
          "Si tocas el sábado 22, verás si tu saldo proyectado tras pagar la comida familiar sigue en terreno positivo.",
      },
    ],
  },
  {
    step: 3,
    shortLabel: "Registrar (+)",
    badge: "Fase 3 de 7 • Simulador en vivo",
    title: "Cómo Registrar un Gasto o Ingreso con (+)",
    intro:
      "Usa el simulador interactivo de abajo para probar en vivo qué pasa con tu dinero según el tipo, estado y monto que elijas, y toca cada campo para conocerlo:",
    targetScreen: "P12",
    targetLabel: "Abrir formulario Nuevo Gasto (+)",
    elements: [
      {
        id: "estado-movimiento",
        label: "Pendiente / Programado vs Ya pagado / Recibido",
        shortTag: "La regla de oro",
        whatIs:
          "Es la decisión más importante del formulario: le dices a la app si ese dinero ya se movió en la vida real o si es un evento futuro.",
        whatFor:
          "Evita alterar tu Saldo Actual con pagos que todavía no haces o sueldos que aún no llegan, pero sí los incluye en tu cierre del mes.",
        howToUse:
          "Elige «Pendiente / Programado» para recibos y quincenas futuras. Elige «Ya pagado / Ya recibido» para compras o cobros que acaban de ocurrir hoy o antes.",
        example:
          "¿Compraste café hoy? → Ya pagado. ¿Recibo de agua que vence el día 25? → Pendiente.",
      },
      {
        id: "tipo-monto",
        label: "Monto Fijo ($) vs Variable (~$)",
        shortTag: "Exacto o estimado",
        whatIs:
          "Te permite marcar si la cantidad es exacta o aproximada. Además, al empezar a escribir cualquier cantidad el cero inicial desaparece solo.",
        whatFor:
          "Te ayuda a distinguir compromisos fijos (como renta o suscripciones) de montos que fluctúan cada mes (recibos o comisiones).",
        howToUse:
          "Solo escribe los números (sin borrar ceros a mano) y selecciona «Fijo» o «Variable (aproximado)».",
        example:
          "Netflix mensual ($219 Fijo); Despensa semanal (~$1,500 Variable).",
      },
      {
        id: "categoria-prioridad",
        label: "Categoría y Prioridad",
        shortTag: "Orden automático",
        whatIs:
          "Al seleccionar una categoría (Vivienda, Comida, Salud, Entretenimiento), la app sugiere automáticamente su prioridad predeterminada.",
        whatFor:
          "Alimenta los gráficos de la pestaña Presupuesto para mostrarte exactamente en qué rubros se está yendo tu dinero.",
        howToUse:
          "Elige la categoría correcta y, si ese gasto puntual tiene otra urgencia (ej. una salida de trabajo), cambia su píldora de prioridad en un toque.",
        example:
          "Un taxi al aeropuerto por trabajo puede llevar categoría Transporte con prioridad ◆ Importante.",
      },
      {
        id: "repetir-periodico",
        label: "Interruptor «¿Se repite periódicamente?»",
        shortTag: "Automatización",
        whatIs:
          "Una opción dentro del mismo formulario de registro para convertir ese gasto o ingreso en una regla automática mensual, quincenal, catorcenal o semanal.",
        whatFor:
          "Te ahorra volver a capturar lo mismo cada mes y proyecta automáticamente tus próximos meses en el calendario.",
        howToUse:
          "Actívalo si es algo periódico (como una suscripción o tu sueldo), elige cada cuánto ocurre y se generarán los próximos meses.",
        example:
          "Actívalo una sola vez al registrar tu gimnasio mensual y ya aparecerá cada mes solo.",
      },
    ],
  },
  {
    step: 4,
    shortLabel: "Acciones",
    badge: "Fase 4 de 7 • Simulador de estado",
    title: "Confirmar, Reprogramar, Cancelar o Eliminar",
    intro:
      "Cuando tocas cualquier movimiento en el calendario o en Movimientos entras a su detalle. Prueba los 4 botones del simulador de abajo para ver qué hace cada uno:",
    targetScreen: "P18",
    targetLabel: "Ir a Movimientos para probar",
    elements: [
      {
        id: "accion-confirmar",
        label: "Confirmar pago / cobro",
        shortTag: "Cierra el compromiso",
        whatIs:
          "Convierte un movimiento Pendiente o Programado en Ya pagado o Ya recibido.",
        whatFor:
          "Actualiza tu Saldo Actual real al instante, guarda la diferencia entre lo planeado y lo real, y deja la marca ✓ visible en el calendario.",
        howToUse:
          "Toca el movimiento pendiente, presiona «Confirmar pago» (o cobro), verifica o corrige el monto real pagado y guarda.",
        example:
          "Tenías ~$700 estimados de agua y pagaste $640: confirmas $640 y automáticamente recuperas $60 en tu proyección.",
      },
      {
        id: "accion-reprogramar",
        label: "Reprogramar fecha",
        shortTag: "Cambia de día",
        whatIs:
          "Mueve un movimiento pendiente o programado a una nueva fecha dentro del calendario conservando su fecha original como referencia.",
        whatFor:
          "Te ayuda a ajustar tu flujo cuando un cliente te pide pagar después o cuando adelantas un recibo a tu quincena.",
        howToUse:
          "Dentro del detalle del movimiento elige «Reprogramar fecha», selecciona el nuevo día y opcionalmente anota el motivo.",
        example:
          "Mueves un pago del día 12 al día 16 después de cobrar tu quincena para evitar caer en saldo rojo.",
      },
      {
        id: "accion-cancelar",
        label: "Cancelar compromiso ($0.00)",
        shortTag: "Se mantiene en $0",
        whatIs:
          "Marca el compromiso como Cancelado y ajusta su monto a $0.00 sin borrar el registro del historial.",
        whatFor:
          "Sirve cuando un compromiso recurrente de este mes no se realizó (ej. te perdonaron un cobro o pausaste una salida) pero quieres conservar evidencia de que existió y quedó en $0.",
        howToUse:
          "Usa «Cancelar compromiso» cuando quieras dejar constancia de $0.00 sin contar ese gasto ni ese ingreso en los totales.",
        example:
          "Cancelaste una clase este mes: queda tachada como Cancelado en $0.00 y libera ese dinero en tu presupuesto.",
      },
      {
        id: "accion-eliminar",
        label: "Eliminar definitivamente",
        shortTag: "Borra y recalcula",
        whatIs:
          "Borra por completo el movimiento de la base de datos y de la vista actual (con confirmación previa para evitar accidentes).",
        whatFor:
          "Úsalo cuando registraste algo duplicado o te equivocaste al capturarlo y no quieres verlo ni siquiera en $0.",
        howToUse:
          "Toca el botón rojo «Eliminar movimiento» en el detalle, o desliza a la izquierda una fila en la pestaña Movimientos y toca la papelera.",
        example:
          "Capturaste dos veces la despensa de hoy: eliminas una y tanto Movimientos como Presupuesto y Saldo se actualizan al instante.",
      },
    ],
  },
  {
    step: 5,
    shortLabel: "Movimientos",
    badge: "Fase 5 de 7 • Historial y filtros",
    title: "Pestaña Movimientos: Busca, Filtra y Limpia Rápido",
    intro:
      "La segunda pestaña inferior reúne todos tus ingresos y gastos del mes en una lista cronológica. Toca cada herramienta para dominarla:",
    targetScreen: "P18",
    targetLabel: "Ir a la pestaña Movimientos",
    elements: [
      {
        id: "resumen-mov",
        label: "Resumen sincronizado (Ingresos / Gastos / Balance)",
        shortTag: "Totales del mes",
        whatIs:
          "Las 3 tarjetas arriba de Movimientos suman únicamente los movimientos reales del mes visible (excluyendo cancelados).",
        whatFor:
          "Te muestra en una sola vista si durante ese mes completo entró más dinero del que salió.",
        howToUse:
          "Cambia de mes con las flechas < y > arriba para comparar tus totales de este mes contra meses anteriores o futuros.",
        example:
          "Ingresos +$18,000, Gastos -$14,200 → Balance mes +$3,800.",
      },
      {
        id: "buscador-chips",
        label: "Buscador y chips Todos / Gastos / Ingresos",
        shortTag: "Búsqueda en vivo",
        whatIs:
          "Una barra de búsqueda por nombre o nota combinada con botones rápidos para ver Todo, solo Gastos o solo Ingresos.",
        whatFor:
          "Encuentra en menos de 2 segundos cualquier recibo, compra o cobro sin tener que recorrer todo el mes.",
        howToUse:
          "Escribe por ejemplo «Luz» o «Sueldo» en el buscador y alterna los chips arriba si quieres acotar aún más.",
        example:
          "Buscas «CFE» y tocas «Gastos» para revisar cuánto pagaste de luz en el mes.",
      },
      {
        id: "filtros-avanzados",
        label: "Botón «Filtros» avanzados",
        shortTag: "Estado, prioridad y categoría",
        whatIs:
          "Un panel avanzado para filtrar por Vencidos, Pendientes, Pagados/Recibidos, Cancelados, Prioridad (● ◆ ○), Categoría o Recurrentes.",
        whatFor:
          "Ideal cuando quieres revisar «¿qué pagos tengo vencidos o pendientes todavía?» o «¿cuánto llevo en gastos ○ Flexibles?».",
        howToUse:
          "Toca «Filtros» arriba a la derecha, marca los criterios que necesites y presiona «Ver resultados».",
        example:
          "Filtras por Estado: Pendiente + Prioridad: ● Esencial para ver tus recibos obligatorios por liquidar.",
      },
      {
        id: "deslizar-eliminar",
        label: "Deslizar fila para eliminar",
        shortTag: "Gesto táctil rápido",
        whatIs:
          "Cada tarjeta de movimiento soporta deslizamiento horizontal (swipe hacia la izquierda) para mostrar el botón rojo de eliminar.",
        whatFor:
          "Te permite depurar movimientos erróneos rápidamente y recalcula presupuesto y saldo de forma inmediata.",
        howToUse:
          "En celular desliza la fila hacia la izquierda y toca «Eliminar»; o simplemente toca la fila para abrir su pantalla completa.",
        example:
          "Registraste un gasto por error mientras probabas → deslizas a la izquierda → Eliminar → tu saldo vuelve a la normalidad.",
      },
    ],
  },
  {
    step: 6,
    shortLabel: "Presupuesto",
    badge: "Fase 6 de 7 • Control y tramos",
    title: "Pestaña Presupuesto y «Hasta tu próximo ingreso»",
    intro:
      "Más allá de un límite mensual, esta pestaña protege tu dinero entre una quincena/catorcena y la siguiente. Toca cada sección para saber cómo interpretarla:",
    targetScreen: "P20",
    targetLabel: "Ir a mi Presupuesto",
    elements: [
      {
        id: "techo-mensual",
        label: "Techo mensual y botón «Ajustar techo»",
        shortTag: "Límite editable",
        whatIs:
          "Es la barra principal que compara tus gastos (ya pagados + pendientes por pagar del mes) contra tu límite máximo mensual.",
        whatFor:
          "Te avisa antes de gastar de más y te dice exactamente cuánto margen disponible te queda dentro de tu presupuesto.",
        howToUse:
          "Si pusiste un límite muy bajo al iniciar o tu sueldo cambió, toca «Ajustar techo» arriba a la derecha para cambiar el límite, el % de alerta (80%) o el colchón (10%).",
        example:
          "Tu techo es $15,000, llevas $9,000 pagados y $3,000 pendientes = $12,000 comprometidos (80%) → aún tienes $3,000 libres.",
      },
      {
        id: "proximo-ingreso",
        label: "Tramo «Hasta tu próximo ingreso»",
        shortTag: "Liquidez real hoy",
        whatIs:
          "Calcula qué gastos pendientes te toca cubrir entre HOY y la fecha de tu siguiente depósito/quincena/catorcena, usando únicamente tu Saldo actual.",
        whatFor:
          "Es tu escudo contra sobregiros: evita que gastes dinero de hoy en cosas opcionales cuando todavía te faltan recibos por pagar antes del próximo cobro.",
        howToUse:
          "Mira «Restante para tu tramo»: ese es el dinero realmente libre que puedes usar antes de que vuelva a entrar dinero.",
        example:
          "Tienes $4,500 hoy, te falta pagar renta ($3,000) antes de cobrar el día 30 → tu dinero libre real hasta tu pago son $1,500.",
      },
      {
        id: "resumen-prioridades",
        label: "Gastos por Prioridad (● ◆ ○)",
        shortTag: "Dónde recortar",
        whatIs:
          "Divide todo lo que estás gastando en el mes entre ● Esenciales, ◆ Importantes y ○ Flexibles.",
        whatFor:
          "Te revela rápidamente si tus gastos flexibles están ocupando una parte enorme del mes y cuánto puedes liberar si los frenas.",
        howToUse:
          "Si estás cerca del tope del mes, revisa la barra de ○ Flexible y recorta salidas o compras no urgentes de los próximos días.",
        example:
          "Ves que llevas $4,200 en ○ Flexible contra $3,000 de margen → decides pausar salidas hasta fin de mes.",
      },
      {
        id: "desglose-categorias",
        label: "Desglose por Categorías",
        shortTag: "Pagado vs Por pagar",
        whatIs:
          "Un listado de tus categorías activas ordenadas de mayor a menor gasto, detallando cuánto ya está pagado y cuánto sigue pendiente.",
        whatFor:
          "Detecta en qué área específica se está fugando tu dinero cada mes.",
        howToUse:
          "Úsalo al cierre de cada quincena para ajustar tus metas de gasto del siguiente mes.",
        example:
          "Notas que Comida + Entretenimiento suman el 45% de tu presupuesto total.",
      },
    ],
  },
  {
    step: 7,
    shortLabel: "Recurrentes",
    badge: "Fase 7 de 7 • Automatización y Más",
    title: "Reglas Recurrentes, Catorcenas y Menú «Más»",
    intro:
      "Aprende a automatizar cobros complejos (como catorcenas alternadas o pagos en varios días del mes), tarjetas de crédito y respaldos de seguridad:",
    targetScreen: "P22",
    targetLabel: "Ir a Compromisos Recurrentes",
    elements: [
      {
        id: "reglas-ingresos",
        label: "Catorcenas alternadas y calendario multi-día",
        shortTag: "Ingresos flexibles",
        whatIs:
          "En «Compromisos recurrentes» puedes crear reglas mensuales, bimestrales, quincenales, catorcenales (cada 14 días) o elegir múltiples días específicos del calendario (1–31 y fin de mes).",
        whatFor:
          "Se adapta si recibes una catorcena grande ($9,500) y otra pequeña ($8,500), si cobras en 3 fechas del mes o si tu pago se adelanta al viernes cuando cae en fin de semana.",
        howToUse:
          "Entra a Más → Compromisos recurrentes → Nueva regla → elige tu esquema y activa montos diferenciados si tus cobros alternan entre sí.",
        example:
          "Configuras «Catorcena Nómina» con 1er cobro $9,500 y 2do cobro $8,500: el calendario alternará ambos montos automáticamente.",
      },
      {
        id: "alcances-edicion",
        label: "3 alcances al editar una regla recurrente",
        shortTag: "Control de cambios",
        whatIs:
          "Cuando editas o ajustas un movimiento generado por una regla recurrente, puedes elegir: Solo este evento, Este y siguientes, o Toda la serie.",
        whatFor:
          "Protege tu historial pasado cuando un servicio sube de precio o cuando este mes hubo un descuento especial.",
        howToUse:
          "Si subió tu Internet a partir de hoy, edita el pago actual y selecciona «Este y los siguientes». Si fue un cambio de un solo mes, usa «Solo este evento».",
        example:
          "Netflix sube de $219 a $249 en diciembre → editas diciembre eligiendo «Este y los siguientes» y noviembre queda intacto en $219.",
      },
      {
        id: "tarjetas-credito",
        label: "Regla de oro para Tarjetas de Crédito",
        shortTag: "Sin doble conteo",
        whatIs:
          "Las tarjetas de crédito se manejan registrando su fecha límite de pago mensual como un compromiso recurrente (usando tu pago total estimado o para no generar intereses).",
        whatFor:
          "Evita restar dos veces el mismo gasto de tu cuenta de débito (una vez cuando pasas la tarjeta y otra vez cuando pagas el estado de cuenta).",
        howToUse:
          "Crea una regla recurrente «Pago Tarjeta» el día de tu fecha límite con monto Variable (~$) y actualiza el monto exacto cuando te llegue tu estado de cuenta.",
        example:
          "Fecha límite día 22 → pones «Pago Tarjeta» el día 22 por ~$4,500 Variable y al pagar ajustas a la cifra exacta del corte.",
      },
      {
        id: "menu-mas",
        label: "Menú «Más»: Categorías, Corte y Respaldo JSON",
        shortTag: "Configuración completa",
        whatIs:
          "La cuarta pestaña reúne tus herramientas de administración: Reglas recurrentes, Categorías y prioridades, Alertas, Edición de saldo/corte inicial, Exportar/Importar respaldo JSON, Guía de instalación y Reinicio.",
        whatFor:
          "Te da control total para respaldar tu información financiera o reiniciar tus movimientos si quieres empezar un periodo limpio.",
        howToUse:
          "Descarga un respaldo JSON periódico desde Más → Exportar respaldo para tener una copia guardada en tu dispositivo.",
        example:
          "Desde Más → Saldo y corte inicial puedes corregir tu saldo de arranque sin borrar tu historial posterior.",
      },
    ],
  },
];

interface ManualSection {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
}

const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: "conceptos",
    title: "1. Conceptos Fundamentales y Regla de Corte",
    summary:
      "Cómo administra la aplicación tu dinero líquido sin duplicar ni inventar saldos.",
    bullets: [
      "Cuenta principal líquida: Representa el dinero real disponible hoy para pagar (cuenta de débito / nómina + efectivo).",
      "Saldo inicial y fecha de corte: Al configurar tu cuenta defines cuánto dinero tienes hoy y en qué fecha. Ese punto actúa como corte contable.",
      "Protección contra doble conteo: Si registras un gasto pagado o un ingreso recibido con fecha anterior a tu fecha de corte, el sistema lo suma a las estadísticas del mes y al presupuesto, pero NO altera tu saldo actual porque ese movimiento ya estaba reflejado en el saldo con el que iniciaste.",
      "Prohibición de saldos pasados inventados: Si navegas en el calendario a un mes anterior a tu fecha de corte inicial, la app mostrará los movimientos registrados pero indicará claramente que el saldo histórico no está disponible antes de tu fecha de corte.",
    ],
  },
  {
    id: "calendario",
    title: "2. Calendario Mensual y Semáforo de Liquidez",
    summary:
      "Lectura visual del mes, marcadores geométricos por día y estados del semáforo.",
    bullets: [
      "Tarjeta de Resumen Superior: Muestra tu Saldo actual, tu Cierre proyectado de fin de mes, los ingresos recibidos vs. programados, los gastos pagados vs. pendientes y el avance de tu presupuesto. Al deslizar hacia abajo se compacta automáticamente.",
      "Marcadores y confirmados en cada día: Cada casilla del calendario muestra un punto verde si hay ingresos, las figuras geométricas de tus gastos (● Esencial, ◆ Importante, ○ Flexible) y una palomita verde (✓) cuando todos los movimientos de ese día ya fueron pagados o recibidos.",
      "Visibilidad continua tras confirmar: Al confirmar un gasto como Pagado o un ingreso como Recibido, NO desaparece del calendario; permanece visible tanto en el día real de pago como en su fecha programada original y en la lista 'Confirmados este mes' debajo del calendario.",
      "Detalle del día: Al tocar cualquier día del calendario se abre una hoja inferior con todos los compromisos de esa fecha (pendientes y confirmados) para revisarlos o agregar uno nuevo.",
      "Semáforo Verde (Proyección saludable): Tu cierre de mes es positivo y ningún día del mes baja de tu colchón mínimo de seguridad.",
      "Semáforo Ámbar (Atención / Proyección parcial): Algún día del mes tu saldo baja de tu colchón mínimo, o tienes gastos pendientes variables sin monto estimado.",
      "Semáforo Rojo (Riesgo de déficit): En algún día del mes o al cierre tus pagos superan el dinero disponible en cuenta (saldo menor a $0.00).",
    ],
  },
  {
    id: "movimientos-alta",
    title: "3. Programado vs. Recibido y Pendiente vs. Pagado (+)",
    summary:
      "Para qué sirve cada estado, cómo afecta tu saldo hoy vs. fin de mes y cuándo usar cada uno.",
    bullets: [
      "Ingreso PROGRAMADO (¿para qué sirve?): Úsalo para dinero que AÚN NO entra a tu cuenta (ej. tu próxima quincena, un aguinaldo o una factura que un cliente te pagará la siguiente semana). NO aumenta tu Saldo Actual hoy, pero SÍ se suma a tu Saldo Proyectado de fin de mes para planear tus gastos.",
      "Ingreso YA RECIBIDO (¿para qué sirve?): Úsalo cuando el dinero YA ingresó físicamente a tu banco o cartera hoy o en días pasados. Suma de inmediato a tu Saldo Actual (salvo fechas anteriores a tu corte inicial) y aparece confirmado en tu calendario sin quedar pendiente.",
      "Gasto PENDIENTE vs. YA PAGADO: Elige 'Pendiente' para recibos o pagos futuros (reservan tu Saldo Proyectado y Presupuesto sin restar de tu Saldo Actual hoy). Elige 'Ya pagado' para desembolsos que ya salieron de tu cuenta.",
      "Monto Fijo ($) vs. Variable (~$): Usa 'Fijo' cuando conoces la cifra exacta (ej. renta o internet) y 'Variable' cuando es un cálculo aproximado (ej. recibo de luz o supermercado).",
    ],
  },
  {
    id: "confirmacion",
    title: "4. Confirmación de Pagos y Comparativa Estimado vs. Real",
    summary:
      "Qué ocurre cuando pagas un recibo o recibes un depósito programado.",
    bullets: [
      "Confirmar pago de gasto: Al tocar 'Confirmar pago' en un compromiso pendiente o vencido, puedes escribir el monto exacto que pagaste. El sistema guarda tu cambio, actualiza tu Saldo Actual y mantiene visible el movimiento como 'Pagado' en tu calendario (en la cuadrícula y en 'Confirmados este mes').",
      "Confirmar recepción de ingreso: Cuando te depositan un ingreso programado o atrasado, confírmalo para que se sume a tu saldo actual.",
      "Regla de Ingresos Atrasados: Si un ingreso programado llega a su fecha esperada y no se ha confirmado como recibido, pasa a estado 'Ingreso atrasado' y deja de sumarse al saldo proyectado hasta que lo confirmes o lo reprogrames.",
      "Regla de Gastos Vencidos: Si un gasto pendiente pasa de su fecha sin pagarse, se marca como 'Vencido' en rojo y sigue restando en tu proyección hasta que lo pagues, reprogrames o canceles.",
    ],
  },
  {
    id: "presupuesto",
    title: "5. Presupuesto Mensual y Tramo 'Hasta tu próximo ingreso'",
    summary:
      "Cómo controlar tu techo de gasto mensual y cuidar tu liquidez entre quincenas.",
    bullets: [
      "Techo mensual comprometido: Tu presupuesto suma tanto lo que ya pagaste como lo que tienes pendiente por pagar en el mes. Así sabes cuánto margen libre real te queda.",
      "Comparativa Cuenta vs. Presupuesto: Te muestra lado a lado cuánto dinero proyectas tener en el banco al cerrar el mes frente a cuánto margen te queda en tu límite presupuestal.",
      "Tarjeta 'Hasta tu próximo ingreso': Calcula cuántos días faltan para tu siguiente cobro, cuánto suman los pagos que debes hacer antes de esa fecha y con cuánto saldo quedarás justo antes de cobrar.",
      "Punto más bajo del mes: Identifica la fecha exacta en que tu cuenta tendrá el menor saldo del mes y lo compara contra tu colchón mínimo de seguridad.",
    ],
  },
  {
    id: "recurrentes-tarjetas",
    title: "6. Reglas Recurrentes y Uso Correcto de Tarjetas de Crédito",
    summary:
      "Automatización de pagos periódicos, alcances de edición y manejo de tarjetas.",
    bullets: [
      "Reglas Recurrentes (Menú Más → Recurrentes): Configura pagos o ingresos semanales, quincenales, mensuales, bimestrales o anuales. Puedes pausar una regla en cualquier momento sin perder los pagos históricos.",
      "Alcance de edición en series recurrentes: Al modificar un pago recurrente puedes elegir si el cambio aplica 'Solo a este pago', 'A este y los siguientes', o 'A todos los pendientes'. Los pagos ya liquidados en el pasado están protegidos con candado y nunca se alteran.",
      "Cómo registrar Tarjetas de Crédito: Como la app controla tu liquidez real, NO registres cada café o compra individual hecha con tarjeta de crédito como salida inmediata. En su lugar, registra el 'Pago mensual de tu tarjeta' como un gasto recurrente en su fecha límite de pago.",
    ],
  },
  {
    id: "categorias-avisos",
    title: "7. Categorías, Centro de Avisos y Bitácora de Auditoría",
    summary:
      "Organización personalizada, alertas preventivas e historial de modificaciones.",
    bullets: [
      "Categorías con prioridad por defecto: Cada categoría tiene asignada una prioridad sugerida (Esencial, Importante o Flexible) que se rellena automáticamente al crear un gasto.",
      "Desactivación lógica de categorías: Si ya no usas una categoría (ej. 'Viaje 2025'), puedes desactivarla sin que se borren los movimientos históricos asociados a ella.",
      "Centro de avisos: Agrupa alertas de gastos vencidos, pagos que vencen hoy, ingresos atrasados y avisos cuando superas el umbral de alerta de tu presupuesto.",
      "Bitácora de auditoría: En Configuración y en el detalle de cada movimiento puedes consultar el registro exacto de cambios de monto, fecha o estado.",
    ],
  },
];

export function InteractiveTutorialModal() {
  const {
    isTutorialOpen,
    setIsTutorialOpen,
    tutorialInitialPhase,
    setActiveScreen,
    user,
  } = useFinanceStore();

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string>(
    INTERACTIVE_TUTORIAL_PHASES[0].elements[0].id
  );

  // Estados de mini-simuladores interactivos dentro de las Fases 3 y 4
  const [simType, setSimType] = useState<"expense" | "income">("expense");
  const [simSettled, setSimSettled] = useState<boolean>(false);
  const [simAmountType, setSimAmountType] = useState<"fixed" | "variable">(
    "fixed"
  );
  const [simAction, setSimAction] = useState<
    "confirm" | "reschedule" | "cancel" | "delete"
  >("confirm");

  useEffect(() => {
    if (isTutorialOpen) {
      const clampedIdx = Math.min(
        INTERACTIVE_TUTORIAL_PHASES.length - 1,
        Math.max(0, (tutorialInitialPhase || 1) - 1)
      );
      setPhaseIdx(clampedIdx);
      setSelectedElementId(
        INTERACTIVE_TUTORIAL_PHASES[clampedIdx].elements[0].id
      );
    }
  }, [isTutorialOpen, tutorialInitialPhase]);

  const selectPhase = (nextIdx: number) => {
    const bounded = Math.min(
      INTERACTIVE_TUTORIAL_PHASES.length - 1,
      Math.max(0, nextIdx)
    );
    setPhaseIdx(bounded);
    setSelectedElementId(INTERACTIVE_TUTORIAL_PHASES[bounded].elements[0].id);
  };

  const closeTutorial = () => {
    setIsTutorialOpen(false);
  };

  const slideSwipeHandlers = useHorizontalSwipe({
    enabled: isTutorialOpen,
    threshold: 52,
    onSwipeLeft: () => selectPhase(phaseIdx + 1),
    onSwipeRight: () => selectPhase(phaseIdx - 1),
  });

  const modalDrag = useBottomSheetDragToDismiss({
    enabled: isTutorialOpen,
    onClose: closeTutorial,
  });

  if (!isTutorialOpen) return null;

  const phase = INTERACTIVE_TUTORIAL_PHASES[phaseIdx];
  const activeElement =
    phase.elements.find((el) => el.id === selectedElementId) ||
    phase.elements[0];
  const isLast = phaseIdx === INTERACTIVE_TUTORIAL_PHASES.length - 1;

  // Cálculos en vivo para el simulador de la Fase 3 (sobre una base ejemplo de $5,000)
  const simBaseSaldo = 5000;
  const simAmount = 1200;
  const simNewSaldoActual = !simSettled
    ? simBaseSaldo
    : simType === "income"
      ? simBaseSaldo + simAmount
      : simBaseSaldo - simAmount;
  const simNewProyectado =
    simType === "income"
      ? simBaseSaldo + simAmount
      : simBaseSaldo - simAmount;

  return (
    <div
      onClick={modalDrag.handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        onTouchStart={(e) => {
          slideSwipeHandlers.onTouchStart(e);
          modalDrag.sheetTouchHandlers.onTouchStart(e);
        }}
        onTouchMove={modalDrag.sheetTouchHandlers.onTouchMove}
        onTouchEnd={(e) => {
          slideSwipeHandlers.onTouchEnd(e);
          modalDrag.sheetTouchHandlers.onTouchEnd();
        }}
        onTouchCancel={() => {
          slideSwipeHandlers.onTouchCancel();
          modalDrag.sheetTouchHandlers.onTouchCancel();
        }}
        style={modalDrag.sheetStyle}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[430px] bg-[#FFFFFF] rounded-t-3xl sm:rounded-3xl p-5 border border-[#E4E6DE] shadow-2xl space-y-3.5 max-h-[92dvh] overflow-y-auto"
      >
        <div className="w-12 h-1.5 rounded-full bg-[#E4E6DE] mx-auto sm:hidden" />

        {/* Encabezado numerado */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8DCCB] text-[#34483D] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              Tutorial Interactivo • Fase {phase.step} de{" "}
              {INTERACTIVE_TUTORIAL_PHASES.length}
            </span>
          </span>
          <button
            type="button"
            onClick={closeTutorial}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-[#F0F1EB] text-[#68736B] hover:text-[#26332D] cursor-pointer"
            title="Cerrar tutorial"
            aria-label="Cerrar tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra numerada de Fases (1 a 7) */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {INTERACTIVE_TUTORIAL_PHASES.map((p, idx) => {
            const isActive = idx === phaseIdx;
            return (
              <button
                key={p.step}
                type="button"
                onClick={() => selectPhase(idx)}
                className={`shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer inline-flex items-center gap-1 ${
                  isActive
                    ? "bg-[#34483D] text-white border-[#34483D] shadow-2xs"
                    : "bg-[#F6F5F0] text-[#68736B] border-[#E4E6DE] hover:text-[#26332D]"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full text-[10px] inline-flex items-center justify-center font-extrabold ${
                    isActive
                      ? "bg-[#E8DCCB] text-[#26332D]"
                      : "bg-[#E4E6DE] text-[#34483D]"
                  }`}
                >
                  {p.step}
                </span>
                <span>{p.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Título e introducción de la fase */}
        <div className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#23845B]">
            {phase.badge}
          </div>
          <h2 className="text-base font-bold text-[#26332D] leading-snug">
            {phase.step}. {phase.title}
          </h2>
          <p className="text-xs text-[#68736B] leading-relaxed">
            {phase.intro}
          </p>
        </div>

        {/* Vista interactiva de casilla en Fase 2 */}
        {phase.step === 2 && (
          <div className="p-3 rounded-2xl bg-[#F6F5F0] border border-[#E4E6DE] space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#68736B]">
              Toca cualquier parte de este día de ejemplo:
            </div>
            <div className="bg-[#FFFFFF] rounded-xl border border-[#34483D]/30 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedElementId("detalle-dia")}
                  className="text-xs font-extrabold text-[#26332D] hover:underline cursor-pointer"
                >
                  Día 15 • Quincena
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedElementId("check-confirmado")}
                  className="px-2 py-0.5 rounded-full bg-[#EDF7F2] text-[#23845B] border border-[#C6E7D6] text-[10px] font-bold cursor-pointer"
                >
                  ✓ Pagado visible
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedElementId("cifras-dia")}
                  className="px-2 py-1 rounded-lg bg-[#EDF7F2] text-[#23845B] text-[11px] font-bold tabular-nums cursor-pointer"
                >
                  +$9,500
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedElementId("cifras-dia")}
                  className="px-2 py-1 rounded-lg bg-[#FDF2F2] text-[#C94C4C] text-[11px] font-bold tabular-nums cursor-pointer"
                >
                  -$3,800
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedElementId("monto-aprox")}
                  className="px-2 py-1 rounded-lg bg-[#FEF7EC] text-[#D99A32] text-[11px] font-bold tabular-nums cursor-pointer"
                >
                  ~-$650 Luz
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSelectedElementId("prioridades-iconos")}
                className="w-full flex items-center justify-around py-1.5 px-2 rounded-lg bg-[#F6F5F0] border border-[#E4E6DE] cursor-pointer"
              >
                <PriorityBadge priority="essential" compact />
                <PriorityBadge priority="important" compact />
                <PriorityBadge priority="flexible" compact />
              </button>
            </div>
          </div>
        )}

        {/* Simulador en vivo en Fase 3 */}
        {phase.step === 3 && (
          <div className="p-3 rounded-2xl bg-[#F6F5F0] border border-[#E4E6DE] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#34483D]">
                Simulador práctico (Base hoy: $5,000 • Movimiento: $1,200)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setSimType("expense");
                  setSelectedElementId("estado-movimiento");
                }}
                className={`py-1.5 px-2 rounded-xl font-bold border cursor-pointer ${
                  simType === "expense"
                    ? "bg-[#C94C4C] text-white border-[#C94C4C]"
                    : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE]"
                }`}
              >
                Simular Gasto (-$1,200)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimType("income");
                  setSelectedElementId("estado-movimiento");
                }}
                className={`py-1.5 px-2 rounded-xl font-bold border cursor-pointer ${
                  simType === "income"
                    ? "bg-[#23845B] text-white border-[#23845B]"
                    : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE]"
                }`}
              >
                Simular Ingreso (+$1,200)
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setSimSettled(false);
                  setSelectedElementId("estado-movimiento");
                }}
                className={`py-1.5 px-2 rounded-xl font-semibold border cursor-pointer ${
                  !simSettled
                    ? "bg-[#34483D] text-white border-[#34483D]"
                    : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE]"
                }`}
              >
                {simType === "expense" ? "Pendiente (futuro)" : "Programado (futuro)"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimSettled(true);
                  setSelectedElementId("estado-movimiento");
                }}
                className={`py-1.5 px-2 rounded-xl font-semibold border cursor-pointer ${
                  simSettled
                    ? "bg-[#34483D] text-white border-[#34483D]"
                    : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE]"
                }`}
              >
                {simType === "expense" ? "Ya pagado ✓" : "Ya recibido ✓"}
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setSimAmountType((t) => (t === "fixed" ? "variable" : "fixed"));
                  setSelectedElementId("tipo-monto");
                }}
                className="px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#E4E6DE] font-semibold text-[#26332D] cursor-pointer"
              >
                Monto:{" "}
                {simAmountType === "fixed" ? "Fijo ($1,200)" : "Variable (~$1,200)"}
              </button>
              <div className="text-right">
                <div className="text-[10px] text-[#68736B]">
                  Hoy:{" "}
                  <strong className="text-[#26332D] tabular-nums">
                    ${simNewSaldoActual.toLocaleString("es-MX")}
                  </strong>{" "}
                  • Fin mes:{" "}
                  <strong className="text-[#34483D] tabular-nums">
                    ${simNewProyectado.toLocaleString("es-MX")}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Simulador interactivo de acciones en Fase 4 */}
        {phase.step === 4 && (
          <div className="p-3 rounded-2xl bg-[#F6F5F0] border border-[#E4E6DE] space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#34483D]">
              Prueba qué hace cada botón de acción:
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setSimAction("confirm");
                  setSelectedElementId("accion-confirmar");
                }}
                className={`py-1.5 px-2 rounded-xl font-bold border cursor-pointer flex items-center justify-center gap-1 ${
                  simAction === "confirm"
                    ? "bg-[#23845B] text-white border-[#23845B]"
                    : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE]"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirmar ✓</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimAction("reschedule");
                  setSelectedElementId("accion-reprogramar");
                }}
                className={`py-1.5 px-2 rounded-xl font-bold border cursor-pointer flex items-center justify-center gap-1 ${
                  simAction === "reschedule"
                    ? "bg-[#527A9A] text-white border-[#527A9A]"
                    : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE]"
                }`}
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span>Reprogramar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimAction("cancel");
                  setSelectedElementId("accion-cancelar");
                }}
                className={`py-1.5 px-2 rounded-xl font-bold border cursor-pointer flex items-center justify-center gap-1 ${
                  simAction === "cancel"
                    ? "bg-[#D99A32] text-white border-[#D99A32]"
                    : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE]"
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cancelar ($0)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimAction("delete");
                  setSelectedElementId("accion-eliminar");
                }}
                className={`py-1.5 px-2 rounded-xl font-bold border cursor-pointer flex items-center justify-center gap-1 ${
                  simAction === "delete"
                    ? "bg-[#C94C4C] text-white border-[#C94C4C]"
                    : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE]"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        )}

        {/* Selector interactivo de elementos de la fase actual */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-[#26332D] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#34483D]" />
            <span>Toca un elemento para ver qué es y cómo se usa:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {phase.elements.map((el) => {
              const selected = el.id === activeElement.id;
              return (
                <button
                  key={el.id}
                  type="button"
                  onClick={() => setSelectedElementId(el.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition cursor-pointer ${
                    selected
                      ? "bg-[#34483D] text-white border-[#34483D] shadow-2xs"
                      : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE] hover:border-[#34483D]/50"
                  }`}
                >
                  {el.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tarjeta detallada del elemento seleccionado */}
        <div className="bg-[#F6F5F0] rounded-2xl p-3.5 border border-[#E4E6DE] space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-[#26332D] text-sm">
              {activeElement.label}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#E8DCCB] text-[#34483D] text-[10px] font-bold shrink-0">
              {activeElement.shortTag}
            </span>
          </div>

          <div className="space-y-2">
            <div className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E4E6DE]/80">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#34483D] mb-0.5">
                ¿Qué es?
              </div>
              <p className="text-[#26332D] leading-relaxed">
                {activeElement.whatIs}
              </p>
            </div>

            <div className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E4E6DE]/80">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#23845B] mb-0.5">
                ¿Para qué sirve?
              </div>
              <p className="text-[#26332D] leading-relaxed">
                {activeElement.whatFor}
              </p>
            </div>

            <div className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E4E6DE]/80">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#527A9A] mb-0.5">
                ¿Cómo usarlo paso a paso?
              </div>
              <p className="text-[#26332D] leading-relaxed">
                {activeElement.howToUse}
              </p>
            </div>

            <div className="bg-[#EDF7F2] p-2.5 rounded-xl border border-[#C6E7D6] flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-[#23845B] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#26332D] leading-relaxed">
                <strong>Ejemplo:</strong> {activeElement.example}
              </p>
            </div>
          </div>
        </div>

        {/* Botón directo a la pantalla real si ya completó el onboarding */}
        {phase.targetScreen && user.onboardingCompleted && (
          <button
            type="button"
            onClick={() => {
              const dest = phase.targetScreen!;
              closeTutorial();
              setActiveScreen(dest);
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-[#EDF7F2] hover:bg-[#DCF0E6] border border-[#C6E7D6] text-[#23845B] text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Target className="w-3.5 h-3.5" />
            <span>{phase.targetLabel || "Ir a esta sección en vivo"}</span>
          </button>
        )}

        {/* Navegación Inferior */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {phaseIdx > 0 ? (
            <button
              type="button"
              onClick={() => selectPhase(phaseIdx - 1)}
              className="min-h-[44px] py-2.5 px-4 rounded-xl bg-[#F0F1EB] text-[#26332D] text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Fase anterior</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={closeTutorial}
              className="min-h-[44px] py-2.5 px-3 text-xs font-semibold text-[#68736B] hover:text-[#26332D] cursor-pointer"
            >
              Cerrar tutorial
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (isLast) {
                closeTutorial();
              } else {
                selectPhase(phaseIdx + 1);
              }
            }}
            className="min-h-[44px] flex-1 py-2.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>
              {isLast
                ? "¡Listo! Empezar a usar la app"
                : `Siguiente: Fase ${phase.step + 1} (${
                    INTERACTIVE_TUTORIAL_PHASES[phaseIdx + 1].shortLabel
                  })`}
            </span>
            {!isLast && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

        <div className="text-[10px] text-center text-[#68736B]">
          Tip: toca los números del 1 al 7 arriba o desliza para recorrer todas las fases
        </div>
      </div>
    </div>
  );
}

export function UserManualScreen() {
  const { setActiveScreen, openTutorialAtPhase, goBack } = useFinanceStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [openId, setOpenId] = useState<string>("conceptos");

  const filteredSections = MANUAL_SECTIONS.filter((sec) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      sec.title.toLowerCase().includes(q) ||
      sec.summary.toLowerCase().includes(q) ||
      sec.bullets.some((b) => b.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          className="min-h-[44px] px-2 -ml-2 rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold text-[#68736B] hover:text-[#26332D] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>
        <button
          type="button"
          onClick={() => openTutorialAtPhase(1)}
          className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#34483D] text-white text-xs font-semibold cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Iniciar Tour Interactivo</span>
        </button>
      </div>

      <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E4E6DE] space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-[#34483D]">
          <BookOpen className="w-4 h-4" />
          <span>Manual de Usuario Completo</span>
        </div>
        <h1 className="text-xl font-bold text-[#26332D]">
          Cómo funciona tu Calendario Financiero Personal
        </h1>
        <p className="text-xs text-[#68736B] leading-relaxed">
          Consulta aquí el funcionamiento detallado de cada pantalla, las reglas de proyección financiera, el uso de prioridades y las recomendaciones prácticas.
        </p>

        <div className="relative pt-2">
          <Search className="w-4 h-4 text-[#68736B] absolute left-3.5 top-1/2 -translate-y-1/2 mt-1" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en el manual (ej. saldo inicial, tarjetas, semáforo, recurrentes)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs text-[#26332D] focus:outline-none focus:border-[#34483D]"
          />
        </div>
      </div>

      {/* Secciones del manual */}
      <div className="space-y-3">
        {filteredSections.map((sec) => {
          const isOpen = openId === sec.id || searchQuery.trim().length > 0;
          return (
            <div
              key={sec.id}
              className="bg-[#FFFFFF] rounded-2xl border border-[#E4E6DE] overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? "" : sec.id)}
                className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-[#F6F5F0] transition cursor-pointer"
              >
                <div>
                  <h2 className="text-sm font-bold text-[#26332D]">
                    {sec.title}
                  </h2>
                  <p className="text-xs text-[#68736B] mt-0.5">{sec.summary}</p>
                </div>
                <span className="text-xs font-bold text-[#34483D] shrink-0 mt-0.5">
                  {isOpen ? "Ocultar" : "Leer"}
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-2 border-t border-[#E4E6DE] space-y-2.5 bg-[#F6F5F0]/50">
                  {sec.bullets.map((b, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-[#26332D] leading-relaxed"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#23845B] shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Accesos rápidos a las secciones de la app */}
      <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-[#68736B]">
          Ir directamente a una sección
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveScreen("P10")}
            className="p-3 rounded-xl bg-[#F0F1EB] hover:bg-[#E8DCCB] text-xs font-semibold text-[#26332D] flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-[#34483D]" />
            <span>Calendario mensual</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen("P20")}
            className="p-3 rounded-xl bg-[#F0F1EB] hover:bg-[#E8DCCB] text-xs font-semibold text-[#26332D] flex items-center gap-2 cursor-pointer"
          >
            <PieChart className="w-4 h-4 text-[#34483D]" />
            <span>Presupuesto mensual</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen("P22")}
            className="p-3 rounded-xl bg-[#F0F1EB] hover:bg-[#E8DCCB] text-xs font-semibold text-[#26332D] flex items-center gap-2 cursor-pointer"
          >
            <Repeat className="w-4 h-4 text-[#34483D]" />
            <span>Reglas recurrentes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen("P12")}
            className="p-3 rounded-xl bg-[#F0F1EB] hover:bg-[#E8DCCB] text-xs font-semibold text-[#26332D] flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#34483D]" />
            <span>Registrar gasto</span>
          </button>
        </div>
      </div>
    </div>
  );
}
