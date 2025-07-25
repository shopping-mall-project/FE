"use client";

import { Button } from "@nextui-org/react";
import { IoClose } from "react-icons/io5";
import useSearchAddress from "@/hooks/useSearchAddress";
import Swal from "sweetalert2";
import useDeleteAddress from "@/hooks/useDeleteAdress";
import { useQueryClient } from "@tanstack/react-query";
import { storeModalShowstep } from "@/store";
import LoadingSpinner from "../LoadingSpinner";
import formatPhoneNumber from "@/util/formatPhoneNumber";
import { storeEditMode } from "@/store";

interface ModalProps {
  setSelectedAddress: (address: any) => void;
  setEditId: (id: string) => void;
}

const Modal = ({ setSelectedAddress, setEditId }: ModalProps) => {
  const { data, isLoading } = useSearchAddress();
  const { mutate: deleteAddress } = useDeleteAddress();
  const queryClient = useQueryClient();
  const { setStep } = storeModalShowstep();
  const { setEditMode } = storeEditMode();

  const sortedData = [...(data?.data || [])].sort(
    (a: any, b: any) => b.is_default - a.is_default
  );

  const handleDeleteAdress = (id: string) => {
    deleteAddress(id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["searchAddress"] });
      },
      onError: () => {
        Swal.fire({
          icon: "error",
          title: "주소 삭제 실패",
          text: "주소를 삭제하지 못했습니다.",
        });
      },
    });
  };

  const handleNewAddress = () => {
    setStep(2);
    setEditMode(false);
  };

  const handleSelectAddress = (address: any) => {
    setSelectedAddress(address);
    setStep(0);
  };

  const handleEditAddress = (id: string) => {
    setEditId(id);
    setStep(4);
    setEditMode(true);
  };

  return (
    <div className="fixed p-0 sm:p-1 inset-0 flex items-center justify-center z-50">
      <div
        className="fixed inset-0 bg-black opacity-50"
        onClick={() => setStep(0)}
      />
      <div className="relative overflow-y-auto scrollbar-hide w-full rounded-none sm:w-[800px] h-full sm:min-h-[443px] sm:max-h-[600px] p-3 bg-white z-10 sm:rounded-lg">
        <div className="flex justify-between items-start">
          <h1 className="text-lg font-semibold mb-5">배송지 정보</h1>
          <button onClick={() => setStep(0)}>
            <IoClose className="text-2xl" />
          </button>
        </div>
        <Button
          variant="bordered"
          className="w-full"
          size="sm"
          onClick={handleNewAddress}
        >
          배송지 추가하기
        </Button>
        {isLoading && (
          <div className="mt-10">
            <LoadingSpinner mode="1" />
          </div>
        )}
        {data?.data.length === 0 && (
          <p className="text-center mt-10 text-gray-600 text-[14px] sm:text-medium">
            등록된 배송지가 없습니다. 배송지를 추가해주세요
          </p>
        )}
        {sortedData?.map((address: any) => (
          <div className="mt-3" key={address?._id}>
            <div className="border-b-2 pb-2">
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold">
                  {address?.receiver_name}
                </p>
                {address?.is_default && (
                  <p className="text-xs bg-gray-100 text-gray-600 rounded-sm p-0.5">
                    기본 배송지
                  </p>
                )}
              </div>
              <div className="my-2 space-y-1 text-sm">
                <p>
                  {address?.main_address} {address?.detail_address}
                </p>
                <p>{address?.zip_code}</p>
                <p>{formatPhoneNumber(address?.receiver_phone)}</p>
                {address?.shipping_memo && <p>{address?.shipping_memo}</p>}
              </div>
              <div className="space-x-0.5">
                <button
                  className="border px-2 py-0.5 rounded-md text-sm"
                  onClick={() => handleEditAddress(address?._id)}
                >
                  수정
                </button>
                <button
                  className="border px-2 py-0.5 rounded-md text-sm"
                  onClick={() => handleSelectAddress(address)}
                >
                  선택
                </button>
                <button
                  className="border px-2 py-0.5 rounded-md text-sm"
                  onClick={() => handleDeleteAdress(address?._id)}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Modal;
