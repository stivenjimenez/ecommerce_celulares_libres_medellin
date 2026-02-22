import Link from "next/link";
import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import styles from "../legal.module.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-display" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Política de Privacidad | Celulares Libres Medellin",
  description: "Política de tratamiento de datos personales para Colombia.",
};

export default function PrivacidadPage() {
  return (
    <main className={`${styles.page} ${sora.variable} ${manrope.variable}`}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          ← Volver al inicio
        </Link>

        <article className={styles.card}>
          <h1>Política de Privacidad</h1>
          <p className={styles.updatedAt}>Última actualización: 22 de febrero de 2026</p>

          <h2>1. Responsable del tratamiento</h2>
          <p>
            Esta política aplica para la tienda “Celulares Libres Medellin” (marca comercial).
            Para completar esta política debes incluir, antes de publicar:
          </p>
          <ul>
            <li>Razón social o nombre completo del responsable.</li>
            <li>NIT o documento de identificación.</li>
            <li>Domicilio físico para notificaciones.</li>
            <li>Canales de atención oficiales (correo y teléfono).</li>
          </ul>
          <p>
            Canales actuales informados en el sitio: <strong>meyox@hotmail.com</strong> y{" "}
            <strong>300 456 9938</strong>.
          </p>

          <h2>2. Datos que recolectamos</h2>
          <ul>
            <li>Datos de identificación y contacto (nombre, teléfono, correo).</li>
            <li>Datos de entrega y facturación (dirección, ciudad, referencias).</li>
            <li>Datos de compra (productos, valor, fecha, estado del pedido).</li>
            <li>Datos técnicos básicos de navegación y seguridad del sitio.</li>
          </ul>

          <h2>3. Finalidades del tratamiento</h2>
          <ul>
            <li>Procesar pedidos, pagos, entregas, cambios y garantías.</li>
            <li>Atender solicitudes, reclamaciones y soporte al cliente.</li>
            <li>Prevenir fraude, suplantación o usos no autorizados.</li>
            <li>
              Enviar información comercial solo cuando exista autorización previa, expresa e
              informada del titular.
            </li>
            <li>Cumplir obligaciones legales y contractuales.</li>
          </ul>

          <h2>4. Derechos del titular</h2>
          <p>
            Como titular de datos personales, puedes conocer, actualizar, rectificar y suprimir tus
            datos, revocar la autorización (cuando proceda) y presentar quejas ante la SIC.
          </p>

          <h2>5. Consultas y reclamos</h2>
          <p>
            Puedes enviar consultas y reclamos al correo <strong>meyox@hotmail.com</strong> o al
            canal de WhatsApp <strong>300 456 9938</strong>.
          </p>
          <ul>
            <li>Consultas: respuesta en máximo 10 días hábiles.</li>
            <li>Reclamos: respuesta en máximo 15 días hábiles.</li>
          </ul>
          <p>
            Si hace falta información para gestionar tu solicitud, te la pediremos por el mismo
            canal.
          </p>

          <h2>6. Compartición y transferencia de datos</h2>
          <p>
            Solo compartimos datos con operadores logísticos, pasarelas de pago y proveedores
            tecnológicos cuando sea necesario para ejecutar la compra o cumplir deberes legales,
            aplicando medidas de seguridad razonables.
          </p>

          <h2>7. Seguridad de la información</h2>
          <p>
            Aplicamos controles administrativos, técnicos y organizacionales para proteger la
            información contra acceso no autorizado, pérdida, alteración o divulgación indebida.
          </p>

          <h2>8. Vigencia</h2>
          <p>
            Esta política está vigente desde su publicación y puede actualizarse cuando cambien los
            procesos o la normativa aplicable. Los cambios se informarán en esta misma página con la
            fecha de actualización.
          </p>

          <h2>9. Autoridad de protección de datos</h2>
          <p>
            La autoridad nacional de protección de datos en Colombia es la Superintendencia de
            Industria y Comercio (SIC):{" "}
            <a href="https://www.sic.gov.co" target="_blank" rel="noreferrer">
              https://www.sic.gov.co
            </a>
            . Si consideras que tus derechos no fueron atendidos, puedes presentar queja ante esta
            entidad.
          </p>

          <p className={styles.note}>
            Base normativa de referencia en Colombia: Ley 1581 de 2012, Decreto 1377 de 2013
            (compilado en el Decreto 1074 de 2015) y lineamientos de la Superintendencia de
            Industria y Comercio (SIC). Si te aplica por tamaño/actividad, debes evaluar la
            obligación de registro en el RNBD.
          </p>
        </article>
      </div>
    </main>
  );
}
