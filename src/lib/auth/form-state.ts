export type LoginActionState = {
  message?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
  values?: {
    email: string;
  };
};

export type RegisterActionState = {
  message?: string;
  fieldErrors?: {
    name?: string;
    email?: string;
    password?: string;
    clinicName?: string;
    clinicSlug?: string;
    phoneE164?: string;
  };
  values?: {
    name: string;
    email: string;
    clinicName: string;
    clinicSlug: string;
    phoneE164: string;
  };
};

export const initialLoginActionState: LoginActionState = {
  values: {
    email: "",
  },
};

export const initialRegisterActionState: RegisterActionState = {
  values: {
    name: "",
    email: "",
    clinicName: "",
    clinicSlug: "",
    phoneE164: "",
  },
};
