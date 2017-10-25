/** @flow */

import invariant from 'invariant';

import {
  isEmailValid,
  isPasswordValid,
  isFirstNameValid,
  isLastNameValid,
} from '../clientserver/authentication';
import ViewerContext from '../entity/vc';
import EntUser from '../entity/EntUser';
import EntInviteCode from '../entity/EntInviteCode';

export default async function genRegisterUser(
  vc: ViewerContext,
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  inviteCode: EntInviteCode,
): Promise<EntUser> {

  invariant(!inviteCode.isUsed(), 'Invite code already used');
  invariant(isEmailValid(email), 'Invalid email');
  invariant(isPasswordValid(password), 'Invalid password');
  invariant(isFirstNameValid(firstName), 'Invalid first name');
  invariant(isLastNameValid(lastName), 'Invalid last name');

  const user = await EntUser.genCreate(
    vc,
    email,
    password,
    firstName,
    lastName,
  );

  await inviteCode.genUse(user);

  return user;
}
