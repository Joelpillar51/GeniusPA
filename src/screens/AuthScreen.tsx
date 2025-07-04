import React, { useState } from 'react';
import { SignInScreen } from './SignInScreen';
import { SignUpScreen } from './SignUpScreen';

export const AuthScreen: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  return isSignUp ? (
    <SignUpScreen onSignInPress={() => setIsSignUp(false)} />
  ) : (
    <SignInScreen onSignUpPress={() => setIsSignUp(true)} />
  );
};