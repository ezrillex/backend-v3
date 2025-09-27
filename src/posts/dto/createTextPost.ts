import { IsString, Length, Matches } from 'class-validator';

export class CreateTextPost {
  @IsString()
  @Length(4, 5000)
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s.,¡!¿?()\-']+$/u, {
    message: 'Solo texto plano en español, sin código ni caracteres inválidos.',
  })
  text: string;
}
