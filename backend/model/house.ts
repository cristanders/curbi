export type HouseRole = 'Admin' | 'Miembro';

export interface HouseMember {
  id_member: number;
  id_house: number;
  id_user: number;
  username: string;
  role: HouseRole;
  created_at?: string;
}

export interface House {
  id_house: number;
  name: string;
  /** Username de quien creo el grupo. Se mantiene como el dueno. */
  username: string;
  created_at?: string;
}

/**
 * Un grupo visto por un usuario concreto: los miembros van dentro porque la
 * pantalla de familia los muestra, y `role`/`member_count` son de la relacion de
 * ese usuario con el grupo, no del grupo en si.
 */
export interface HouseWithMembers extends House {
  members: HouseMember[];
  /** Rol del usuario que pidio la lista, no el del dueno. */
  role: HouseRole | null;
  member_count: number;
  is_member: boolean;
}

export type CreateHouseDto = Omit<House, 'id_house' | 'created_at'>;
