"use client";

import React, { useState } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import {
  useBottomSheetDragToDismiss,
  useHorizontalSwipe,
} from "@/lib/hooks/useSwipeGesture";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  PieChart,
  PlusCircle,
  Repeat,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

const TUTORIAL_SLIDES = [
  {
    step: 1,
    badge: "Bienvenida a tu Calendario",
    title: "¿De qué trata esta aplicación y por qué te dará tranquilidad?",
    description:
      "A diferencia de las apps tradicionales que solo te dicen en qué ya gastaste, el Calendario Financiero Personal te permite ver tus compromisos futuros antes de que ocurran para responder una pregunta clave: ¿con cuánto dinero cerraré el mes si pago todo lo pendiente?",
    highlights: [
      "Anticipa recibos, rentas y suscripciones día por día en el calendario.",
      "Separa el dinero que tienes hoy en tu cuenta de lo que ya está comprometido para próximos pagos.",
      "Evita quedarte sin liquidez a mitad de quincena.",
    ],
  },
  {
    step: 2,
    badge: "Saldo Actual vs. Proyectado",
    title: "Cómo leer tu resumen financiero y tu fecha de corte",
    description:
      "En la parte superior del calendario verás siempre dos cifras principales acompañadas de un semáforo de salud financiera:",
    highlights: [
      "Saldo actual: Es el dinero líquido real que tienes hoy en tu cuenta principal.",
      "Cierre proyectado: Es tu Saldo actual + Ingresos programados del mes − Gastos pendientes por pagar.",
      "Regla de corte sin doble conteo: Si registras un pago que hiciste antes de la fecha de tu saldo inicial, cuenta para tu presupuesto e historial, pero no vuelve a descontarse de tu saldo actual.",
    ],
  },
  {
    step: 3,
    badge: "Prioridades Inteligentes",
    title: "Distingue lo indispensable de lo recortable",
    description:
      "Cada gasto lleva una figura geométrica y una etiqueta de prioridad para que identifiques de un vistazo qué pagos son obligatorios y cuáles son flexibles:",
    highlights: [
      "● Esencial (Círculo terracota): Vivienda, luz, agua, despensa, deudas.",
      "◆ Importante (Rombo ámbar): Gasolina, transporte, salud, seguros, educación.",
      "○ Flexible (Círculo hueco azul): Streaming, salidas, cine, compras opcionales.",
    ],
  },
  {
    step: 4,
    badge: "Botón Central (+)",
    title: "Registra gastos e ingresos en segundos",
    description:
      "Toca el botón circular (+) en la barra inferior para registrar cualquier movimiento:",
    highlights: [
      "Pendiente / Programado: Úsalo para recibos o cobros futuros. Puedes marcar el monto como Fijo ($) o Variable (~$ estimado).",
      "Ya pagado / Ya recibido: Úsalo para compras o depósitos que ya ocurrieron hoy o en días pasados.",
      "Nota sobre Ingresos Atrasados: Si un ingreso esperado pasa de su fecha y aún no lo confirmas, no se suma al saldo proyectado para no inflar tu dinero con cobros inciertos.",
    ],
  },
  {
    step: 5,
    badge: "Confirmación y Presupuesto",
    title: "Del monto estimado al pago real",
    description:
      "Cuando llegue el día de pagar un recibo (como la luz o el internet), tócalo en el calendario y elige 'Confirmar pago':",
    highlights: [
      "La app comparará automáticamente cuánto habías estimado contra cuánto pagaste realmente.",
      "En la pestaña 'Presupuesto' verás tu anillo de consumo mensual y la tarjeta 'Hasta tu próximo ingreso', que te muestra el punto más bajo que tocará tu cuenta en el mes.",
      "Puedes volver a abrir este tutorial o el Manual Completo cuando quieras desde el icono (?) o el menú 'Más'.",
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
      "Marcadores en cada día: Cada casilla del calendario muestra un punto verde si hay ingresos y las figuras geométricas de tus gastos (● Esencial, ◆ Importante, ○ Flexible).",
      "Detalle del día: Al tocar cualquier día del calendario se abre una hoja inferior con todos los compromisos de esa fecha para confirmarlos, ver su detalle o agregar uno nuevo.",
      "Semáforo Verde (Proyección saludable): Tu cierre de mes es positivo y ningún día del mes baja de tu colchón mínimo de seguridad.",
      "Semáforo Ámbar (Atención / Proyección parcial): Algún día del mes tu saldo baja de tu colchón mínimo, o tienes gastos pendientes variables sin monto estimado.",
      "Semáforo Rojo (Riesgo de déficit): En algún día del mes o al cierre tus pagos superan el dinero disponible en cuenta (saldo menor a $0.00).",
    ],
  },
  {
    id: "movimientos-alta",
    title: "3. Cómo Registrar Gastos e Ingresos (+)",
    summary:
      "Diferencia entre compromisos futuros y movimientos ya realizados, montos fijos y variables.",
    bullets: [
      "Gasto Pendiente vs. Ya Pagado: Elige 'Pendiente' para recibos o pagos que harás después (afectan tu saldo proyectado y tu presupuesto comprometido). Elige 'Ya pagado' para desembolsos que ya salieron de tu cuenta.",
      "Ingreso Programado vs. Ya Recibido: Elige 'Programado' para quincenas o cobros futuros. Elige 'Ya recibido' cuando el dinero ya entró a tu cuenta.",
      "Monto Fijo ($) vs. Variable (~$): Usa 'Fijo' cuando conoces la cifra exacta (ej. renta o internet) y 'Variable' cuando es un cálculo aproximado (ej. recibo de luz o supermercado).",
    ],
  },
  {
    id: "confirmacion",
    title: "4. Confirmación de Pagos y Comparativa Estimado vs. Real",
    summary:
      "Qué ocurre cuando pagas un recibo o recibes un depósito programado.",
    bullets: [
      "Confirmar pago de gasto: Al tocar 'Confirmar pago' en un compromiso pendiente o vencido, puedes escribir el monto exacto que pagaste. El sistema te mostrará si pagaste más o menos de lo estimado y cómo cambia tu saldo actual y proyectado antes de guardar.",
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
  const { isTutorialOpen, setIsTutorialOpen } = useFinanceStore();
  const [slideIdx, setSlideIdx] = useState(0);

  const closeTutorial = () => {
    setIsTutorialOpen(false);
    setSlideIdx(0);
  };

  const slideSwipeHandlers = useHorizontalSwipe({
    enabled: isTutorialOpen,
    threshold: 48,
    onSwipeLeft: () =>
      setSlideIdx((i) => Math.min(TUTORIAL_SLIDES.length - 1, i + 1)),
    onSwipeRight: () => setSlideIdx((i) => Math.max(0, i - 1)),
  });

  const modalDrag = useBottomSheetDragToDismiss({
    enabled: isTutorialOpen,
    onClose: closeTutorial,
  });

  if (!isTutorialOpen) return null;

  const slide = TUTORIAL_SLIDES[slideIdx];
  const isLast = slideIdx === TUTORIAL_SLIDES.length - 1;

  return (
    <div
      onClick={modalDrag.handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
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
        className="w-full max-w-[410px] bg-[#FFFFFF] rounded-3xl p-6 border border-[#E4E6DE] shadow-2xl space-y-5"
      >
        <div className="w-12 h-1.5 rounded-full bg-[#E4E6DE] mx-auto -mt-2" />
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8DCCB] text-[#34483D] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              Guía rápida • {slide.step} de {TUTORIAL_SLIDES.length}
            </span>
          </span>
          <button
            type="button"
            onClick={closeTutorial}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-[#F0F1EB] text-[#68736B] hover:text-[#26332D] cursor-pointer"
            title="Cerrar guía"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-[#23845B]">
            {slide.badge}
          </div>
          <h2 className="text-lg font-bold text-[#26332D] leading-snug">
            {slide.title}
          </h2>
          <p className="text-xs text-[#68736B] leading-relaxed">
            {slide.description}
          </p>
        </div>

        {slide.step === 3 && (
          <div className="flex items-center justify-around py-2.5 px-3 rounded-2xl bg-[#F6F5F0] border border-[#E4E6DE]">
            <PriorityBadge priority="essential" compact />
            <PriorityBadge priority="important" compact />
            <PriorityBadge priority="flexible" compact />
          </div>
        )}

        <div className="bg-[#F6F5F0] rounded-2xl p-4 border border-[#E4E6DE] space-y-2.5">
          {slide.highlights.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 text-xs text-[#26332D] leading-relaxed"
            >
              <CheckCircle2 className="w-4 h-4 text-[#23845B] shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* Indicadores de progreso */}
        <div className="flex items-center justify-center gap-1.5">
          {TUTORIAL_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSlideIdx(i)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === slideIdx ? "w-6 bg-[#34483D]" : "w-2 bg-[#E4E6DE]"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          {slideIdx > 0 ? (
            <button
              type="button"
              onClick={() => setSlideIdx((i) => i - 1)}
              className="min-h-[44px] py-3 px-4 rounded-xl bg-[#F0F1EB] text-[#26332D] text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={closeTutorial}
              className="min-h-[44px] py-3 px-3 text-xs font-semibold text-[#68736B] hover:text-[#26332D] cursor-pointer"
            >
              Omitir tour
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (isLast) {
                closeTutorial();
              } else {
                setSlideIdx((i) => i + 1);
              }
            }}
            className="min-h-[44px] flex-1 py-3 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{isLast ? "¡Empezar a usar mi calendario!" : "Siguiente"}</span>
            {!isLast && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
        <div className="text-[10px] text-center text-[#68736B]">
          Tip táctil: desliza izquierda/derecha para cambiar de paso o hacia abajo para cerrar
        </div>
      </div>
    </div>
  );
}

export function UserManualScreen() {
  const { setActiveScreen, setIsTutorialOpen, goBack } = useFinanceStore();
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
          onClick={() => setIsTutorialOpen(true)}
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
