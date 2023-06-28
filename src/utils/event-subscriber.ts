/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { MethodEnum } from 'src/modules/system-logs/model/enum/method.enum';
import { SystemLogsService } from 'src/modules/system-logs/service/system-logs.service';
import {
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
  EntitySubscriberInterface,
  Connection,
} from 'typeorm';

const namesColumnsRemove = [
  'access_profile_areas_areas',
  'system_logs',
  'forget_password',
];

@Injectable()
@EventSubscriber()
export class EverythingSubscriber implements EntitySubscriberInterface {
  constructor(
    @InjectConnection() readonly connection: Connection,

    private readonly systemLogsService: SystemLogsService,
  ) {
    connection.subscribers.push(this);
  }

  afterInsert(event: InsertEvent<unknown>) {
    const dataUser = event?.queryRunner?.data as any;

    if (
      !!dataUser?.id &&
      !namesColumnsRemove.includes(event.metadata.tableName)
    ) {
      const formatedJson = JSON.stringify(event?.entity, null, 2);

      try {
        this.systemLogsService.create({
          method: MethodEnum.POST,
          nameEntity: event.metadata.tableName.toLowerCase(),
          stateInitial: null,
          stateFinal: formatedJson,
          user: dataUser,
        });
      } catch (err) {
        console.log(`BEFORE ENTITY INSERT error`, err);
      }
    }
  }

  afterUpdate(event: UpdateEvent<unknown>) {
    const dataUser = event?.queryRunner?.data as any;

    if (
      !!dataUser?.id &&
      !namesColumnsRemove.includes(event.metadata.tableName)
    ) {
      const formatedInitialJson = JSON.stringify(
        event?.databaseEntity,
        null,
        2,
      );
      const formatedFinalJson = JSON.stringify(event?.entity, null, 2);

      try {
        this.systemLogsService.create({
          method: MethodEnum.PUT,
          nameEntity: event.metadata.tableName.toLowerCase(),
          stateInitial: formatedInitialJson,
          stateFinal: formatedFinalJson,
          user: dataUser,
        });
      } catch (err) {
        console.log(`BEFORE ENTITY UPDATE error`, err);
      }
    }
  }

  beforeRemove(event: RemoveEvent<unknown>) {
    const dataUser = event?.queryRunner?.data as any;

    if (
      !!dataUser?.id &&
      !namesColumnsRemove.includes(event.metadata.tableName)
    ) {
      const formatedInitialJson = JSON.stringify(event?.entity, null, 2);
      const formatedFinalJson = JSON.stringify(event?.databaseEntity, null, 2);

      try {
        this.systemLogsService.create({
          method: MethodEnum.DELETE,
          nameEntity: event.metadata.tableName.toLowerCase(),
          stateInitial: formatedInitialJson,
          stateFinal: formatedFinalJson,
          user: dataUser,
        });
      } catch (err) {
        console.log(`BEFORE ENTITY REMOVE error`, err);
      }
    }
  }
}
