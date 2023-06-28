import { Area } from '../../modules/profile/model/entities/area.entity';
import { Connection } from 'typeorm';
import { Seeder, Factory } from 'typeorm-seeding';
import { areaData } from '../data/area.data';

export class CreateAreaSeed implements Seeder {
  public async run(_factory: Factory, connection: Connection): Promise<void> {
    const areaRepository = connection.getRepository(Area);

    for (const area of areaData) {
      const existsArea = await areaRepository.findOne({
        where: {
          tag: area.tag.toUpperCase(),
        },
      });

      if (!existsArea) {
        await areaRepository
          .create({
            ...area,
            tag: area.tag.toUpperCase(),
          })
          .save();
      }
    }
  }
}
