import { ICompanyDetail } from "./ICompanyDetail";

export interface IUserProfile {
  id: '',
  firstName: string,
  lastName: string,
  email: string,
  countryCode: string,
  phoneNo: string,
  userType:string,
  companyDetail?:ICompanyDetail,
  passwordResetKey?: string,
  isActive?: boolean,
  isEmailVerified?: boolean,
  isPhoneNoVerified?: boolean,
  signedUpUsing?: string,
  profilePicUrl?:string,
}