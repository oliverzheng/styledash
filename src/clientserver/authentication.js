/** @flow */

export type RegisterErrorType =
  'alreadyLoggedIn' |
  'invalidEmail' |
  'invalidPassword' |
  'invalidFirstName' |
  'invalidLastName' |
  'invalidInviteCode' |
  'inviteCodeAlreadyUsed' |
  'passwordMismatch' |
  'emailAlreadyInUse';

export function isEmailValid(email: string): boolean {
  return email.indexOf('@') !== -1;
}

export function isPasswordValid(password: string): boolean {
  return password.length > 7;
}

export function isFirstNameValid(firstName: string): boolean {
  return firstName.length > 0;
}

export function isLastNameValid(lastName: string): boolean {
  return lastName.length > 0;
}
