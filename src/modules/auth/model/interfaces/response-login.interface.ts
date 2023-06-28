/* eslint-disable @typescript-eslint/no-explicit-any */
import { User } from 'src/modules/user/model/entities/user.entity';

export interface ResponseLogin {
  token: string;
  user: any;
}
