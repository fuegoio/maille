export type Contact = {
  id: string;
  contact: ContactUser;
  createdAt: Date;
};

export type ContactUser = {
  id: string;
  name: string;
  email: string;
  image: string;
};
