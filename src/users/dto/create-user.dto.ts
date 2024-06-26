import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class CreateUserDto {

  @Length(1, 100)
  @IsNotEmpty()
  firstName: string;

  @Length(1, 100)
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

}
