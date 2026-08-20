import { IsNotEmpty, IsString } from 'class-validator';

/** Google Identity Services (GIS) id_token sent from the browser. */
export class GoogleAuthDto {
  @IsNotEmpty()
  @IsString()
  credential: string;
}
