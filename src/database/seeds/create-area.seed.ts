import { Area } from '../../modules/profile/model/entities/area.entity';
import { Connection } from 'typeorm';
import { Seeder, Factory } from 'typeorm-seeding';
import { areaData } from '../data/area.data';
import { AccessProfile } from 'src/modules/profile/model/entities/access-profile.entity';
import { CredentialRole } from 'src/modules/user/model/enum/role.enum';
import { ProfileRole } from 'src/modules/profile/model/enum/profile-role';
import { User } from 'src/modules/user/model/entities/user.entity';
import { hashPassword } from 'src/helpers/crypto';
import { SubCredentialRole } from 'src/modules/user/model/enum/sub-role.enum';

export class CreateAreaSeed implements Seeder {
  public async run(_factory: Factory, connection: Connection): Promise<void> {
    const areaRepository = connection.getRepository(Area);
    const accessProfileRepository = connection.getRepository(AccessProfile);
    const usersRepository = connection.getRepository(User);

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

    const verifyExistsProfileDefault = await accessProfileRepository.findOne({
      where: {
        name: 'ADMIN',
      },
    });

    if (!verifyExistsProfileDefault) {
      //criar perfil root
      const areasParc = await areaRepository.find({
        where: {
          role: CredentialRole.PARC,
        },
      });

      const profile = await accessProfileRepository
        .create({
          name: 'ADMIN',
          role: ProfileRole.PARC,
          areas: areasParc,
        })
        .save();

      //criar usuário root
      //adaptar a senha e email conforme seu sistema
      const hashedPassword = hashPassword(String('SUA_SENHA_DO_USUARIO_ROOT'));

      await usersRepository
        .create({
          name: 'Root',
          email: 'seu_email_do_usuario_root@gmail.com',
          cpf: '11111111111',
          telephone: '00000000000',
          subRole: SubCredentialRole.ADMIN,
          role: CredentialRole.PARC,
          password: hashedPassword,
          access_profile: profile,
        })
        .save();
    }
  }
}
