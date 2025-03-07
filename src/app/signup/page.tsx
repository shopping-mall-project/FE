"use client";

import { Button, Input } from "@nextui-org/react";
import { useForm } from "react-hook-form";
import {
  usernameV,
  emailV,
  emailConfirmV,
  passwordV,
  passwordConfirmV,
} from "../validationRules";
import { SignupForm } from "../../../types/signupForm";
import { ErrorMessage } from "@hookform/error-message";
import useSendMail from "@/hooks/useSendMail";
import useConfirmMail from "@/hooks/useConfirmMail";
import useUsernameCheck from "@/hooks/useUsernameCheck";
import useSignup from "@/hooks/useSignup";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { IoPersonAddOutline } from "react-icons/io5";

const Signup = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
  } = useForm<SignupForm>({
    mode: "onChange", // 입력값이 변경될 때마다 유효성 검사
    reValidateMode: "onChange", // 입력값이 변경될 때마다 유효성 검사
  });

  // 이메일 인증시간 카운트다운
  const [countdown, setCountdown] = useState<number | null>(null);
  // 인증시간 만료 메세지 여부
  const [expriedMessage, setExpriedMessage] = useState(false);

  // 커스텀 훅 사용
  const sendMail = useSendMail();
  const confirmMail = useConfirmMail();
  const usernameCheck = useUsernameCheck();
  const signup = useSignup();

  // 시간 포맷 함수
  const formatTime = useCallback((second: number | null) => {
    if (second == null) return;
    const min = Math.floor(second / 60);
    const sec = second % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  }, []);

  // 카운트다운 처리
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev! - 1), 1000);
    } else if (countdown === 0) {
      setCountdown(null);
      setExpriedMessage(true);
    }

    return () => clearTimeout(timer);
  }, [countdown]);

  // 이메일 전송
  const handleSendMail = async () => {
    const isValid = await trigger("email");
    if (isValid) {
      const emailValue = getValues("email");
      sendMail.mutate(emailValue, {
        onSuccess: () => {
          setCountdown(300);
          setExpriedMessage(false);
        },
      });
    }
  };

  // 이메일 인증
  const handleMailConfirm = async () => {
    const isValid = await trigger("emailConfirm");
    if (isValid) {
      const email = getValues("email");
      const emailCode = getValues("emailConfirm").trim();
      confirmMail.mutate(
        { email, emailCode },
        {
          onSuccess: () => {
            setCountdown(null);
            setExpriedMessage(false);
          },
        }
      );
    }
  };

  // 유저이름 중복확인
  const handleUsernameCheck = async () => {
    const isValid = await trigger("username");
    if (isValid) {
      const userName = getValues("username");
      usernameCheck.mutate(userName);
    }
  };

  // 회원가입 요청
  const onSubmit = (formData: SignupForm) => {
    if (!confirmMail.isSuccess || !usernameCheck.isSuccess) {
      Swal.fire({
        icon: "error",
        title: "회원가입 실패",
        text: "이메일 인증과 유저이름 중복확인을 완료해주세요.",
      });
      return;
    }
    const { email, password, username } = formData;
    signup.mutate({ email, password, username });
  };

  const formInDiv = "flex items-end gap-1";
  const errorS = "text-sm text-red-500";
  return (
    <div className="flex items-center justify-center h-[60vh] text-gray-800">
      <form
        className="flex flex-col w-[500px] mx-auto gap-3 border p-3 rounded-md"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex items-center gap-2 text-2xl font-semibold m-1">
          <IoPersonAddOutline />
          회원가입
        </div>
        {/* 이메일 입력&전송&에러메세지 */}
        <div className={formInDiv}>
          <Input
            type="email"
            label="이메일"
            variant="underlined"
            required
            {...register("email", emailV)}
            isDisabled={confirmMail.isSuccess}
          />
          <Button
            variant="bordered"
            size="sm"
            onClick={handleSendMail}
            isLoading={sendMail.isPending}
            isDisabled={confirmMail.isSuccess}
          >
            전송
          </Button>
        </div>
        <ErrorMessage
          errors={errors}
          name="email"
          render={({ message }) => <p className={errorS}>{message}</p>}
        />
        {/* 이메일 인증입력&확인&에러메세지 */}
        <div className={formInDiv}>
          <Input
            type="text"
            label="이메일 인증"
            variant="underlined"
            required
            {...register("emailConfirm", emailConfirmV)}
            isDisabled={confirmMail.isSuccess}
          />
          <p className="text-sm text-yellow-500 m-1">{formatTime(countdown)}</p>
          <Button
            variant="bordered"
            size="sm"
            onClick={handleMailConfirm}
            isLoading={confirmMail.isPending}
            isDisabled={confirmMail.isSuccess}
          >
            인증
          </Button>
        </div>
        {expriedMessage && (
          <p className="text-sm text-red-500">
            인증시간이 만료되었습니다. 다시 인증해주세요.
          </p>
        )}
        <ErrorMessage
          errors={errors}
          name="emailConfirm"
          render={({ message }) => <p className={errorS}>{message}</p>}
        />
        {/* 유저이름 입력&중복확인&에러메세지 */}
        <div className={formInDiv}>
          <Input
            type="text"
            label="유저이름"
            variant="underlined"
            required
            {...register("username", usernameV)}
          />
          <Button
            variant="bordered"
            size="sm"
            isLoading={usernameCheck.isPending}
            onClick={handleUsernameCheck}
          >
            중복확인
          </Button>
        </div>
        <ErrorMessage
          errors={errors}
          name="username"
          render={({ message }) => <p className={errorS}>{message}</p>}
        />
        {/* 비밀번호 입력&에러메세지 */}
        <Input
          type="password"
          label="비밀번호"
          variant="underlined"
          required
          {...register("password", passwordV)}
        />
        <ErrorMessage
          errors={errors}
          name="password"
          render={({ message }) => <p className={errorS}>{message}</p>}
        />
        {/* 비밀번호 확인 입력&에러메세지 */}
        <Input
          type="password"
          label="비밀번호 확인"
          variant="underlined"
          required
          {...register("passwordConfirm", passwordConfirmV)}
        />
        <ErrorMessage
          errors={errors}
          name="passwordConfirm"
          render={({ message }) => <p className={errorS}>{message}</p>}
        />
        {/* 회원가입 버튼 */}
        <div className="flex justify-end">
          <Button type="submit" color="primary" isLoading={signup.isPending}>
            회원가입
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Signup;
