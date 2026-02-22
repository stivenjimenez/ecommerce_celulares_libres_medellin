import Link from "next/link";
import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import styles from "../legal.module.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-display" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Términos y Condiciones | Celulares Libres Medellin",
  description: "Términos de uso y compra para ecommerce en Colombia.",
};

export default function TerminosPage() {
  return (
    <main className={`${styles.page} ${sora.variable} ${manrope.variable}`}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          ← Volver al inicio
        </Link>

        <article className={styles.card}>
          <h1>Términos y Condiciones</h1>
          <p className={styles.updatedAt}>Última actualización: 22 de febrero de 2026</p>

          <h2>1. Identificación del comercio</h2>
          <p>
            Estos términos regulan el uso del sitio y las compras realizadas en “Celulares Libres
            Medellin” (marca comercial). Antes de publicar, completa:
          </p>
          <ul>
            <li>Razón social o nombre del titular del comercio.</li>
            <li>NIT o documento de identificación.</li>
            <li>Dirección física para notificaciones.</li>
            <li>Canales oficiales de atención.</li>
          </ul>

          <h2>2. Aceptación de términos</h2>
          <p>
            Al navegar en el sitio o realizar una compra, aceptas estos términos, la política de
            privacidad y la normativa colombiana aplicable.
          </p>

          <h2>3. Productos, disponibilidad y precios</h2>
          <ul>
            <li>La publicación de productos está sujeta a disponibilidad de inventario.</li>
            <li>Los precios se informan en pesos colombianos (COP).</li>
            <li>
              En caso de error evidente de precio o descripción, el comercio podrá cancelar la orden
              y notificar al cliente.
            </li>
          </ul>

          <h2>4. Proceso de compra y pago</h2>
          <p>
            La orden se entiende recibida cuando el cliente finaliza el checkout y acepta los
            términos. La confirmación final del pedido depende de validación de pago y disponibilidad
            logística.
          </p>

          <h2>5. Envíos y entregas</h2>
          <p>
            Los tiempos de entrega son estimados y pueden variar por cobertura de transportadora,
            condiciones climáticas, orden público u otras situaciones de fuerza mayor.
          </p>

          <h2>6. Derecho de retracto (ventas no tradicionales a distancia)</h2>
          <p>
            Cuando aplique, puedes ejercer retracto dentro de los 5 días hábiles siguientes a la
            entrega del producto. Debes devolver el producto en condiciones aptas y sin uso, salvo
            excepciones legales.
          </p>
          <p>
            En comercio electrónico, y una vez cumplidas las condiciones legales para la devolución,
            el reembolso no podrá exceder 15 días calendario.
          </p>

          <h2>7. Reversión de pago</h2>
          <p>
            En pagos electrónicos, puedes solicitar reversión en los casos previstos por ley
            (operación fraudulenta, no solicitada, producto no recibido, producto no corresponde o
            defectuoso), dentro del término legal y por los canales de atención del comercio y de la
            entidad financiera.
          </p>

          <h2>8. Cambios, devoluciones y garantía</h2>
          <ul>
            <li>
              La garantía legal aplica frente a defectos de calidad, idoneidad o seguridad del
              producto.
            </li>
            <li>
              Las políticas de cambio por gusto o talla pueden existir como beneficio comercial y se
              informan caso a caso.
            </li>
            <li>
              Para gestionar garantías: <strong>meyox@hotmail.com</strong> y{" "}
              <strong>300 456 9938</strong>.
            </li>
          </ul>

          <h2>9. Propiedad intelectual</h2>
          <p>
            Los contenidos del sitio (textos, imágenes, marca, diseño y código) están protegidos por
            la normativa aplicable y no pueden ser usados sin autorización previa.
          </p>

          <h2>10. Limitación de responsabilidad</h2>
          <p>
            El comercio responde dentro de los límites de la ley colombiana y no asume responsabilidad
            por interrupciones atribuibles a terceros o eventos de fuerza mayor.
          </p>

          <h2>11. Ley aplicable y jurisdicción</h2>
          <p>
            Estos términos se rigen por la ley colombiana. Cualquier controversia se tramitará ante
            las autoridades competentes en Colombia.
          </p>

          <h2>12. Autoridad de protección al consumidor</h2>
          <p>
            Para información oficial sobre derechos del consumidor en Colombia, consulta la
            Superintendencia de Industria y Comercio (SIC):{" "}
            <a href="https://www.sic.gov.co" target="_blank" rel="noreferrer">
              https://www.sic.gov.co
            </a>
          </p>

          <p className={styles.note}>
            Base normativa de referencia en Colombia: Ley 1480 de 2011 (Estatuto del Consumidor),
            Ley 2439 de 2024 (actualización para ecommerce), Ley 527 de 1999 (comercio
            electrónico) y disposiciones concordantes.
          </p>
        </article>
      </div>
    </main>
  );
}
