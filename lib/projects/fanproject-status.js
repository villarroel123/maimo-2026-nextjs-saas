export const FANPROJECT_STATUSES = [
  {
    value: "planificado",
    label: "Planificado",
    badgeClassName: "border-[#F2B8CF] bg-white text-[#8A5468]",
  },
  {
    value: "en_preparacion",
    label: "En preparación",
    badgeClassName: "border-[#EAB5C8] bg-[#FCE7F0] text-[#A63D65]",
  },
  {
    value: "listo",
    label: "Listo para el concierto",
    badgeClassName: "border-[#B7DFC5] bg-[#E9F8EE] text-[#287142]",
  },
  {
    value: "realizado",
    label: "Realizado",
    badgeClassName: "border-[#C9B9E9] bg-[#F0EBFC] text-[#62429B]",
  },
];

export const DEFAULT_FANPROJECT_STATUS = FANPROJECT_STATUSES[0].value;

export function getFanProjectStatus(value) {
  return (
    FANPROJECT_STATUSES.find((status) => status.value === value) ||
    FANPROJECT_STATUSES[0]
  );
}
