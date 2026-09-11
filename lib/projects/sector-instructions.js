const SEPARATOR = "|";

export function parseSectorInstructions(value) {
  if (typeof value !== "string") return [];

  return value
    .split(/\r?\n/)
    .map((line) => {
      const [sector, ...instructionParts] = line.split(SEPARATOR);
      const instruccion = instructionParts.join(SEPARATOR).trim();

      return {
        sector: sector?.trim() || "",
        instruccion,
      };
    })
    .filter(({ sector, instruccion }) => sector && instruccion);
}

export function getSectorInstructions(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => ({
      sector: typeof item?.sector === "string" ? item.sector.trim() : "",
      instruccion: typeof item?.instruccion === "string" ? item.instruccion.trim() : "",
    }))
    .filter(({ sector, instruccion }) => sector && instruccion);
}

export function sectorInstructionsToText(value) {
  return getSectorInstructions(value)
    .map(({ sector, instruccion }) => `${sector} ${SEPARATOR} ${instruccion}`)
    .join("\n");
}
