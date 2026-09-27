import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../config/database';
import { House, HouseMember, HouseRole, HouseWithMembers } from '../model/house';

interface HouseRow extends RowDataPacket {
  id_house: number;
  name: string | null;
  username: string | null;
  created_at: Date | null;
  role: HouseRole | null;
  member_count: number | null;
}

export class HouseRepository {
  /**
   * Grupos donde el usuario aparece, ya sea como dueno (House.username) o como
   * miembro (House_member). La union de las dos es lo que hace que la pantalla
   * muestre tanto las familias que uno creo como a las que se sumo.
   *
   * `viewerId` es el usuario que esta mirando: define `role` e `is_member` en el
   * resultado, que son de la relacion de el con el grupo.
   */
  async findVisibleByUser(idUser: number, username: string): Promise<HouseWithMembers[]> {
    const [rows] = await db.query<HouseRow[]>(
      `SELECT h.id_house,
              h.name,
              h.username,
              h.created_at,
              vm.role,
              (SELECT COUNT(*) FROM House_member m WHERE m.id_house = h.id_house) AS member_count
         FROM House h
         LEFT JOIN House_member vm ON vm.id_house = h.id_house AND vm.id_user = ?
        WHERE h.username = ?
           OR EXISTS (
             SELECT 1 FROM House_member m2
              WHERE m2.id_house = h.id_house AND m2.id_user = ?
           )
     ORDER BY h.id_house`,
      [idUser, username, idUser],
    );

    return await Promise.all(
      rows.map(async (r) => this.toHouseWithMembers(r, idUser)),
    );
  }

  async findMembers(idHouse: number): Promise<HouseMember[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT m.id_member, m.id_house, m.id_user, m.role, m.created_at, u.username
         FROM House_member m
         JOIN Users u ON u.id_user = m.id_user
        WHERE m.id_house = ?
     ORDER BY FIELD(m.role, 'Admin', 'Miembro'), m.id_member`,
      [idHouse],
    );
    return rows as HouseMember[];
  }

  async findById(idHouse: number): Promise<House | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM House WHERE id_house = ?',
      [idHouse],
    );
    return (rows[0] as House) ?? null;
  }

  async create(houseDto: { name: string; username: string }): Promise<House> {
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO House (name, username) VALUES (?, ?)',
      [houseDto.name, houseDto.username],
    );
    return { id_house: result.insertId, ...houseDto };
  }

  async isMember(idHouse: number, idUser: number): Promise<boolean> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT 1 AS ok FROM House_member WHERE id_house = ? AND id_user = ?',
      [idHouse, idUser],
    );
    return rows.length > 0;
  }

  /**
   * Agrega al usuario al grupo. El INSERT ignora duplicados en vez de fallar: si
   * ya es miembro, `isMember` lo detecto antes y la UI no deberia llegar aqui, pero
   * un doble clic no debe producir un error 500.
   */
  async addMember(idHouse: number, idUser: number, role: HouseRole): Promise<void> {
    await db.query(
      'INSERT IGNORE INTO House_member (id_house, id_user, role) VALUES (?, ?, ?)',
      [idHouse, idUser, role],
    );
  }

  private async toHouseWithMembers(r: HouseRow, viewerId: number): Promise<HouseWithMembers> {
    const members = await this.findMembers(r.id_house);
    return {
      id_house: r.id_house,
      name: r.name ?? 'Sin nombre',
      username: r.username ?? '',
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
      members,
      role: r.role ?? null,
      member_count: Number(r.member_count ?? members.length),
      is_member: members.some((m) => m.id_user === viewerId),
    };
  }
}
