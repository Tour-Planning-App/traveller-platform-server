import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEmail
} from "class-validator";


export class CreateEmailServerDto {

  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Recipient email (to) is required' })
  to: string;


  @IsString({ message: 'Subject must be a string' })
  @IsNotEmpty({ message: 'Subject is required' })
  subject: string;

  @IsString({ message: 'Body must be a string' })
  @IsNotEmpty({ message: 'Body is required' })
  body: string;
}