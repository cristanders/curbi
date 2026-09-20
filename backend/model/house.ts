export interface House {
  id_house: number;
  name: string;
  username: string;
}

export type CreateHouseDto = Omit<House, 'id_house'>;