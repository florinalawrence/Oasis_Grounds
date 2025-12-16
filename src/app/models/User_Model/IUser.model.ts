export interface IUser {
  applicationId: string;
  email: string;
  password:string;
  confirmPassword:string;
  registrationType:[];
  isActive?: boolean;
}
