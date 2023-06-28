import { CredentialRole } from 'src/modules/user/model/enum/role.enum';
import { InternalServerError } from 'src/shared/errors';
import { EntityRepository, Repository } from 'typeorm';
import { CreateAreaDto } from '../model/dto/create-area.dto';
import { Area } from '../model/entities/area.entity';

@EntityRepository(Area)
export class AreaProfileRepository extends Repository<Area> {
  async createArea(dto: CreateAreaDto): Promise<Area> {
    const { name, tag, role } = dto;

    const area = this.create({
      name,
      role,
      tag,
    });

    try {
      return await area.save();
    } catch (e) {
      throw new InternalServerError();
    }
  }

  findAllByRole(role: CredentialRole): Promise<Area[]> {
    return this.find({
      where: {
        role,
      },
    });
  }
}
