import { CreateHouseDto, House } from "../model/house";
import { HouseRepository } from "../repository/houseRepository";


export class HouseService {
  private houseRepository = new HouseRepository();

  async obtenerCasasPorUsuario(username: string): Promise<House[]> {
    return await this.houseRepository.findByUsername(username);
  }

  async crearCasa(houseDto: CreateHouseDto): Promise<House> {
    if (!houseDto.name) {
      throw new Error('El nombre de la casa es obligatorio');
    }
    return await this.houseRepository.create(houseDto);
  }
}