import { useState, useEffect, Fragment, useCallback } from "react";
import {
  EnvelopeIcon,
  LockClosedIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";

import Logo from "@/assets/appLogo.svg?react";
import {
  Button,
  Card,
  Input,
  InputErrorMsg,
  Progress,
} from "@/components/ui";
import { useAuthContext } from "@/app/contexts/auth/context";
import { Page } from "@/components/shared/Page";

type PhoneForm = {
  phone: string;
};

type OtpForm = {
  otp: string;
};

const OTP_DURATION = 120;

export default function SignIn() {
  const { sendOtp, verifyOtp, errorMessage, isLoading } = useAuthContext();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");

  const [timer, setTimer] = useState(OTP_DURATION);
  const [canResend, setCanResend] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const phoneForm = useForm<PhoneForm>({
    defaultValues: {
      phone: "",
    },
  });

  const otpForm = useForm<OtpForm>({
    defaultValues: {
      otp: "",
    },
  });

  useEffect(() => {
    if (step !== "otp") return;

    setTimer(OTP_DURATION);
    setCanResend(false);

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  const progressValue = (timer / OTP_DURATION) * 100;

  const formatTime = useCallback((sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  const handleSendOtp = useCallback(
    async (data: PhoneForm) => {
      try {
        await sendOtp(data.phone);

        setPhone(data.phone);
        setStep("otp");
        otpForm.reset({ otp: "" });
        setIsModalOpen(true);
      } catch {}
    },
    [otpForm, sendOtp],
  );

  const handleVerifyOtp = useCallback(
    async (data: OtpForm) => {
      try {
        await verifyOtp(phone, data.otp);
      } catch {}
    },
    [phone, verifyOtp],
  );

  const handleChangePhone = useCallback(() => {
    setStep("phone");
    setCanResend(false);
    setTimer(OTP_DURATION);
    otpForm.reset({ otp: "" });
  }, [otpForm]);

  const handleResendOtp = useCallback(async () => {
    try {
      await sendOtp(phone);

      setTimer(OTP_DURATION);
      setCanResend(false);
      otpForm.reset({ otp: "" });
      setIsModalOpen(true);
    } catch {}
  }, [otpForm, phone, sendOtp]);

  return (
    <Page title="ورود">
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-100 flex items-center justify-center px-4"
          onClose={() => setIsModalOpen(false)}
        >
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          </TransitionChild>

          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="relative w-full max-w-md rounded-lg bg-white p-8 text-center dark:bg-dark-700">
              <CheckCircleIcon className="mx-auto size-20 text-success" />

              <div className="mt-4">
                <DialogTitle className="text-xl font-semibold">
                  کد تأیید ارسال شد
                </DialogTitle>

                <p className="mt-3 text-sm text-gray-600 dark:text-dark-200">
                  کد یکبار مصرف به شماره
                  <span className="mx-1 font-semibold">{phone}</span>
                  ارسال شد. لطفاً پیامک‌های خود را بررسی کنید و کد دریافتی را
                  وارد نمایید.
                  <br />
                  در صورت عدم دریافت کد، پس از
                  <span className="mx-1 font-semibold">۲ دقیقه</span>
                  دوباره تلاش کنید.
                </p>

                <Button
                  onClick={() => setIsModalOpen(false)}
                  color="success"
                  className="mt-6 w-full"
                >
                  متوجه شدم
                </Button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>

      <main className="min-h-100vh grid w-full grow place-items-center">
        <div className="w-full max-w-[26rem] p-4 sm:px-5">
          <div className="text-center">
            <Logo className="mx-auto size-16" />
            <div className="mt-4">
              <h2 className="text-2xl font-semibold text-gray-600 dark:text-dark-100">
                خوش آمدید
              </h2>
              <p className="text-gray-400 dark:text-dark-300">
                برای ادامه وارد شوید
              </p>
            </div>
          </div>

          <Card className="mt-5 rounded-lg p-5 lg:p-7">
            {step === "phone" && (
              <form
                onSubmit={phoneForm.handleSubmit(handleSendOtp)}
                autoComplete="off"
              >
                <Input
                  label="شماره موبایل"
                  placeholder="09123456789"
                  prefix={<EnvelopeIcon className="size-5" />}
                  disabled={isLoading}
                  {...phoneForm.register("phone", { required: true })}
                />

                <div className="mt-2">
                  <InputErrorMsg
                    when={(errorMessage && errorMessage !== "") as boolean}
                  >
                    {errorMessage}
                  </InputErrorMsg>
                </div>

                <Button
                  type="submit"
                  className="mt-5 w-full"
                  color="primary"
                  disabled={isLoading}
                >
                  {isLoading ? "در حال ارسال..." : "دریافت کد تایید"}
                </Button>
              </form>
            )}

            {step === "otp" && (
              <form
                onSubmit={otpForm.handleSubmit(handleVerifyOtp)}
                autoComplete="off"
              >
                <Input
                  label="کد تایید"
                  placeholder="کد ارسال شده را وارد کنید"
                  prefix={<LockClosedIcon className="size-5" />}
                  disabled={isLoading}
                  {...otpForm.register("otp", { required: true })}
                />

                <div className="mt-2">
                  <InputErrorMsg
                    when={(errorMessage && errorMessage !== "") as boolean}
                  >
                    {errorMessage}
                  </InputErrorMsg>
                </div>

                <div className="mt-4 space-y-3">
                  <Progress
                    value={progressValue}
                    isActive
                    className="h-2"
                    color="primary"
                  />

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>زمان باقی مانده: {formatTime(timer)}</span>

                    {canResend ? (
                      <button
                        type="button"
                        className="text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={handleResendOtp}
                        disabled={isLoading}
                      >
                        ارسال مجدد
                      </button>
                    ) : (
                      <span>در انتظار دریافت کد...</span>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="mt-5 w-full"
                  color="primary"
                  disabled={isLoading}
                >
                  {isLoading ? "در حال بررسی..." : "ورود"}
                </Button>

                <Button
                  type="button"
                  variant="outlined"
                  className="mt-3 w-full"
                  onClick={handleChangePhone}
                  disabled={isLoading}
                >
                  تغییر شماره
                </Button>
              </form>
            )}
          </Card>
        </div>
      </main>
    </Page>
  );
}
