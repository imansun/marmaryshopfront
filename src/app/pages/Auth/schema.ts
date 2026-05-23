import * as Yup from "yup";

export interface PhoneFormValues {
  phone: string;
}

export interface OtpFormValues {
  otp: string;
}

export const phoneSchema = Yup.object().shape({
  phone: Yup.string()
    .trim()
    .matches(/^09\d{9}$/, "شماره موبایل معتبر نیست")
    .required("شماره موبایل الزامی است"),
});

export const otpSchema = Yup.object().shape({
  otp: Yup.string()
    .trim()
    .length(6, "کد تایید باید ۶ رقم باشد")
    .required("کد تایید الزامی است"),
});
