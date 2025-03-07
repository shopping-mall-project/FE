"use client";

import Image from "next/image";
import { useState } from "react";
import { BsThreeDots } from "react-icons/bs";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import useRemoveReview from "@/hooks/useRemoveReview";
import { useQueryClient } from "@tanstack/react-query";
import { Rate } from "antd";
import { useRouter } from "next/navigation";
import usePostLike from "@/hooks/usePostLike";
import useUnlike from "@/hooks/useUnlike";
import formatDate from "@/util/formatDate";
import Swal from "sweetalert2";

interface UserId {
  data: {
    userId: string;
    email: string;
    isLoggedIn: boolean;
    role: string;
    username: string;
  };
}

export default function ReviewItem({ review }: { review: any }) {
  const queryClient = useQueryClient();
  const [fullsize, setFullsize] = useState(false);
  const [menu, setMenu] = useState(false);
  const imgSize = fullsize ? 500 : 100;
  const { mutate: removeReviewMutate } = useRemoveReview();
  const router = useRouter();
  const { mutate: postLikeMutate, isPending: postLikePending } = usePostLike();
  const { mutate: unlikeMutate, isPending: unlikePending } = useUnlike();

  const catchedUserId = queryClient.getQueryData<UserId>(["authCheck"]);
  const likeCheck = review.likedBy.includes(catchedUserId?.data?.userId);

  const showMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setMenu((prev) => !prev);
  };

  const handleRemove = () => {
    removeReviewMutate(review?._id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["reviews"] });
      },
    });
  };

  const handleRouteEdit = () => router.push(`/reviewEdit/${review._id}`);

  const handlePostLike = () => {
    if (postLikePending || unlikePending) return;
    if (!catchedUserId?.data?.isLoggedIn) {
      Swal.fire({
        icon: "error",
        title: "로그인이 필요한 서비스입니다.",
        timer: 1000,
        showConfirmButton: false,
      });
      return;
    }

    if (likeCheck) {
      unlikeMutate(review._id, {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["reviews", review.article],
          });
        },
      });
      return;
    }
    postLikeMutate(review._id, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["reviews", review.article],
        });
      },
    });
  };

  return (
    <div className="border-b py-3">
      <div className="flex gap-3 items-center">
        <Image
          src="/basic_profile.png"
          alt="Profile Image"
          width={30}
          height={30}
        />

        <div className="text-sm space-y-1">
          <div className="flex gap-2">
            <p className="font-semibold">nickname</p>
            <p className="text-gray-400 text-xs">
              {formatDate(review?.updatedAt)}
            </p>
          </div>
          <Rate
            value={review.rate}
            disabled
            style={{
              fontSize: fullsize ? "24px" : "12px",
            }}
          />
          <span
            className={`ml-1 font-semibold ${
              fullsize ? "text-[24px]" : "text-[14px]"
            }`}
          >
            {review.rate}
          </span>
        </div>
        <div className="flex-grow" />
        <div className="flex justify-end flex-grow relative">
          <button onClick={showMenu}>
            <BsThreeDots className="text-lg" />
          </button>
          {menu && (
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenu(false)}
            />
          )}
          <div
            className={`flex flex-col gap-2 p-2 w-[60px] bg-white border rounded-md absolute top-4 text-sm ${
              menu ? "block" : "hidden"
            } shadow-md z-10`}
          >
            <button className="hover:font-semibold" onClick={handleRouteEdit}>
              수정
            </button>
            <button className="hover:font-semibold" onClick={handleRemove}>
              삭제
            </button>
          </div>
        </div>
      </div>
      <h1 className="font-semibold">{review.title}</h1>
      <div className={`flex ${fullsize ? "flex-col" : "flex-row"} gap-1 mt-10`}>
        {review.images.map((img: string) => (
          <Image
            src={img}
            key={img}
            alt="img"
            width={imgSize}
            height={imgSize}
            className="rounded-md object-cover"
            onClick={() => setFullsize((prev) => !prev)}
          />
        ))}
      </div>

      <div className="mt-5 text-gray-600 text-sm">
        <span>{review.content}</span>
      </div>

      <div className="flex items-center gap-0.5 mt-5 text-gray-600">
        <button onClick={handlePostLike}>
          {likeCheck ? <AiFillLike /> : <AiOutlineLike className="text-lg" />}
        </button>
        <p>{review.likes}</p>
      </div>
    </div>
  );
}
