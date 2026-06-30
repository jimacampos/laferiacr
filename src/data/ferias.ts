import rawData from "./ferias.json";
import type { Feria, FeriasData, Region } from "./types";

const data = rawData as FeriasData;

export const ferias: Feria[] = data.ferias;
export const regions: Region[] = data.regions;
export const dataGeneratedAt: string = data.generatedAt;
export const dataSource: string = data.source;

const regionsById = new Map(regions.map((region) => [region.id, region]));

export function getRegion(regionId: string): Region | undefined {
  return regionsById.get(regionId);
}
