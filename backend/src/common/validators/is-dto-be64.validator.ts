import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsDtoBe64(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDtoBe64',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          return /^[A-Za-z0-9+/]{43}=$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `Public key must be valid base64 (44 chars). Received: ${typeof args.value === 'string' ? args.value.substring(0, 10) + '...' : String(args.value)}`;
        },
      },
    });
  };
}
