import divipola from "@/lib/data/colombia-divipola.json";

// DANE DIVIPOLA, corte 2024-12-30 (datos.gov.co, conjunto gdxc-w37w).
// Incluye municipios, distritos y San Andrés (registrado como isla).
export const colombianDepartments = divipola;

export function resolveColombianLocation(
  departmentCode: string,
  cityCode: string,
) {
  const department = colombianDepartments.find(
    ({ code }) => code === departmentCode,
  );
  const municipality = department?.municipalities.find(
    ([code]) => code === cityCode,
  );
  if (!department || !municipality) return null;
  return { department: department.name, city: municipality[1] };
}
