import { BusinessError } from '../model/errors';
import { House, HouseWithMembers } from '../model/house';
import { HouseRepository } from '../repository/houseRepository';
import { UserRepository } from '../repository/userRepository';

const USERNAME_RE = /^[A-Za-z0-9._-]{3,30}$/;

export class HouseService {
  private houseRepository = new HouseRepository();
  private userRepository = new UserRepository();

  /**
   * Grupos visibles para `username`. `viewerId` es quien pregunta: la misma lista
   * sirve para ver "mi familia" y para descubrir los grupos de otra persona (lo
   * que usa el formulario de unirse).
   */
  async obtenerCasasPorUsuario(
    username: string,
    viewerId: number,
  ): Promise<HouseWithMembers[]> {
    this.validarUsername(username);
    return await this.houseRepository.findVisibleByUser(this.validarId(viewerId), username);
  }

  /** Crea el grupo y registra al creador como Admin. */
  async crearCasa(name: string, username: string, idUser: number): Promise<House> {
    this.validarUsername(username);
    const id = this.validarId(idUser);

    const limpio = (name ?? '').trim();
    if (limpio.length === 0) {
      throw new BusinessError('CASA_INVALIDA', 'Ponle un nombre a la familia');
    }
    if (limpio.length > 60) {
      throw new BusinessError('CASA_INVALIDA', 'El nombre es demasiado largo');
    }

    const house = await this.houseRepository.create({ name: limpio, username });
    await this.houseRepository.addMember(house.id_house, id, 'Admin');
    return house;
  }

  /**
   * Une al usuario a un grupo. Los tres casos que pueden fallar se distinguen con
   * su propio mensaje, porque "no se pudo unir" sin mas no ayuda a nadie:
   * el grupo no existe, el usuario no existe, o ya es miembro.
   */
  async unirseAGrupo(idHouse: number, idUser: number, username: string): Promise<HouseWithMembers> {
    const id = this.validarId(idUser);
    this.validarUsername(username);

    const house = await this.houseRepository.findById(idHouse);
    if (!house) {
      throw new BusinessError('CASA_INEXISTENTE', 'Ese grupo no existe', 404);
    }
    if (await this.houseRepository.isMember(idHouse, id)) {
      throw new BusinessError('YA_ES_MIEMBRO', 'Ya eres parte de este grupo');
    }

    const existe = await this.userRepository.findByUsername(username);
    if (!existe) {
      throw new BusinessError('USUARIO_INVALIDO', 'Ese usuario no existe', 404);
    }

    await this.houseRepository.addMember(idHouse, id, 'Miembro');
    const [conMiembros] = await this.houseRepository.findVisibleByUser(id, username);
    return (
      conMiembros ?? {
        id_house: house.id_house,
        name: house.name,
        username: house.username,
        members: [],
        role: 'Miembro',
        member_count: 1,
        is_member: true,
      }
    );
  }

  private validarId(idUser: number): number {
    const id = Number(idUser);
    if (!Number.isFinite(id) || id <= 0) {
      throw new BusinessError('USUARIO_INVALIDO', 'El usuario no es valido', 401);
    }
    return id;
  }

  private validarUsername(username: string): string {
    const limpio = (username ?? '').trim();
    if (!USERNAME_RE.test(limpio)) {
      throw new BusinessError('USUARIO_INVALIDO', 'Ese username no es valido');
    }
    return limpio;
  }
}
