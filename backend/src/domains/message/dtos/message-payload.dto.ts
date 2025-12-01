import { IsNotEmpty, IsString, IsIn, IsISO8601, Matches, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MessagePayloadDto {
  @ApiProperty({
    description: 'UUID получателя',
    example: '7abb74ba-22bf-41c5-a2ed-618528a5e2ab',
  })
  @IsNotEmpty()
  @IsUUID()
  to!: string;

  @ApiProperty({
    description: 'Тип сообщения',
    example: 'text',
    enum: ['text', 'image', 'file'],
  })
  @IsNotEmpty()
  @IsIn(['text', 'image', 'file'])
  type!: 'text' | 'image' | 'file';

  @ApiProperty({
    description: 'Зашифрованное содержимое сообщения (base64)',
    example: 'U2FsdGVkX1+abc123...',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Za-z0-9+/]+=*$/, {
    message: 'encryptedContent must be valid base64',
  })
  encryptedContent!: string;

  @ApiProperty({
    description: 'Зашифрованный сессионный ключ для получателя (base64)',
    example: 'U2FsdGVkX1+def456...',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Za-z0-9+/]+=*$/, {
    message: 'encryptedKey must be valid base64',
  })
  encryptedKey!: string;

  @ApiProperty({
    description: 'Время отправки в ISO 8601 формате',
    example: '2025-11-26T15:30:00.000Z',
  })
  @IsNotEmpty()
  @IsISO8601()
  timestamp!: string;
}
